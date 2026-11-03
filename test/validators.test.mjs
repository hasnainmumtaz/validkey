import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOpenAI } from '../dist/validators/openai.js';
import { validateAnthropic } from '../dist/validators/anthropic.js';
import { getValidator } from '../dist/validators/index.js';

const providers = [
  { name: 'OpenAI', validate: validateOpenAI, url: 'https://api.openai.com/v1/models', headers: { Authorization: 'Bearer fake-test-key' } },
  { name: 'Anthropic', validate: validateAnthropic, url: 'https://api.anthropic.com/v1/models', headers: { 'x-api-key': 'fake-test-key', 'anthropic-version': '2023-06-01' } },
];
for (const provider of providers) {
  test(`${provider.name}: sends one read-only request to the correct provider`, async t => {
    const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.equal(url, provider.url);
      assert.equal(options.method, 'GET');
      assert.equal(options.body, undefined);
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      for (const [name, value] of Object.entries(provider.headers)) assert.equal(options.headers[name], value);
      return new Response('{}', { status: 200 });
    });
    const result = await provider.validate('  fake-test-key  ');
    assert.equal(result.valid, true);
    assert.equal(result.status, 'accepted');
    assert.equal(result.httpStatus, 200);
    assert.equal(fetch.mock.callCount(), 1);
  });
  test(`${provider.name}: empty keys and invalid timeouts never reach the network`, async t => {
    const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not call'); });
    for (const value of ['', '   ']) assert.equal((await provider.validate(value)).status, 'input_error');
    for (const timeoutMs of [0, -1, 1.5, NaN, Infinity, 2147483648]) {
      assert.equal((await provider.validate('fake-test-key', { timeoutMs })).status, 'input_error');
    }
    assert.equal(fetch.mock.callCount(), 0);
  });
  for (const [httpStatus, status] of [[401, 'unauthorized'], [403, 'permission_denied'], [429, 'rate_limited'], [500, 'provider_error'], [503, 'provider_error'], [400, 'unexpected_response'], [404, 'unexpected_response']]) {
    test(`${provider.name}: HTTP ${httpStatus} is ${status} without leaking response text`, async t => {
      t.mock.method(globalThis, 'fetch', async () => new Response('fake-test-key', { status: httpStatus, statusText: 'fake-test-key' }));
      const result = await provider.validate('fake-test-key');
      assert.equal(result.valid, false);
      assert.equal(result.status, status);
      assert.equal(result.httpStatus, httpStatus);
      assert.ok(!JSON.stringify(result).includes('fake-test-key'));
    });
  }
  test(`${provider.name}: network errors never echo exception text`, async t => {
    t.mock.method(globalThis, 'fetch', async () => { throw new Error('credential: fake-test-key'); });
    const result = await provider.validate('fake-test-key');
    assert.equal(result.status, 'network_error');
    assert.equal(result.valid, false);
    assert.ok(!JSON.stringify(result).includes('fake-test-key'));
  });
  test(`${provider.name}: request deadline aborts a stalled fetch`, async t => {
    let signal;
    t.mock.method(globalThis, 'fetch', (_url, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }));
    });
    const result = await provider.validate('fake-test-key', { timeoutMs: 20 });
    assert.equal(result.status, 'timeout');
    assert.equal(result.valid, false);
    assert.equal(signal.aborted, true);
  });
  test(`${provider.name}: clears the deadline and cancels unused response bodies`, async t => {
    let signal;
    let cancelled = false;
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
      signal = options.signal;
      return new Response(new ReadableStream({ cancel() { cancelled = true; } }));
    });
    assert.equal((await provider.validate('fake-test-key', { timeoutMs: 20 })).status, 'accepted');
    await new Promise(resolve => setTimeout(resolve, 35));
    assert.equal(signal.aborted, false);
    assert.equal(cancelled, true);
  });
}

test('provider lookup rejects inherited properties and accepts mixed case', () => {
  for (const name of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'unknown']) assert.equal(getValidator(name), undefined);
  assert.equal(getValidator('OPENAI'), validateOpenAI);
});
