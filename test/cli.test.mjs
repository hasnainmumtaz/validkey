import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const preload = fileURLToPath(new URL('./fixtures/mock-fetch.cjs', import.meta.url));
const fakeKey = 'fake-cli-test-key';
function run(args, overrides = {}, input = '') {
  const env = { ...process.env, OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', NODE_OPTIONS: '', VALIDKEY_TEST_RESPONSE: '200', ...overrides };
  const result = spawnSync(process.execPath, ['--require', preload, cli, ...args], { env, input, encoding: 'utf8', timeout: 5000, windowsHide: true });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.ok(!(result.stdout + result.stderr).includes(fakeKey), 'Output must not expose credentials');
  return result;
}
function json(args, overrides, input) {
  const result = run([...args, '--json'], overrides, input);
  assert.equal(result.stderr, '');
  assert.equal(result.stdout.trim().split('\n').length, 1);
  return { ...result, data: JSON.parse(result.stdout) };
}

test('help lists providers and all new options without credentials', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  for (const text of ['openai, anthropic', '--json', '--stdin', '--prompt', '--timeout']) assert.ok(result.stdout.includes(text));
});
for (const [service, variable] of [['openai', 'OPENAI_API_KEY'], ['anthropic', 'ANTHROPIC_API_KEY']]) {
  test(`${service}: original env usage and success output stay compatible`, () => {
    const result = run([service], { [variable]: `  ${fakeKey}  ` });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), 'Valid');
    assert.equal(result.stderr, '');
  });
  test(`${service}: missing key is actionable`, () => {
    const result = json([service]);
    assert.equal(result.status, 1);
    assert.equal(result.data.status, 'input_error');
    assert.match(result.data.message, new RegExp(variable));
  });
}
test('case-insensitive service and explicit key precedence', () => {
  const result = json(['OPENAI', fakeKey], { OPENAI_API_KEY: 'ignored-key' });
  assert.equal(result.status, 0);
  assert.equal(result.data.service, 'openai');
  assert.equal(result.data.status, 'accepted');
});
for (const service of ['unknown', '__proto__', 'constructor', 'toString', 'hasOwnProperty', fakeKey]) {
  test(`unsupported service is safely rejected: ${service}`, () => {
    const result = json([service]);
    assert.equal(result.status, 1);
    assert.equal(result.data.status, 'unsupported_service');
    assert.equal(result.data.service, null);
  });
}
for (const [response, status] of [['200', 'accepted'], ['401', 'unauthorized'], ['403', 'permission_denied'], ['429', 'rate_limited'], ['503', 'provider_error'], ['404', 'unexpected_response'], ['network', 'network_error'], ['timeout', 'timeout']]) {
  test(`JSON reports ${status} with compatible exit codes`, () => {
    const result = json(['openai', fakeKey, '--timeout', '20'], { VALIDKEY_TEST_RESPONSE: response });
    assert.equal(result.status, response === '200' ? 0 : 1);
    assert.equal(result.data.valid, response === '200');
    assert.equal(result.data.status, status);
    assert.equal(result.data.service, 'openai');
    assert.equal(result.data.httpStatus, Number(response) || undefined);
  });
  test(`quiet suppresses ${status}, including with JSON`, () => {
    const result = run(['openai', fakeKey, '--quiet', '--json', '--timeout', '20'], { VALIDKEY_TEST_RESPONSE: response });
    assert.equal(result.status, response === '200' ? 0 : 1);
    assert.equal(result.stdout + result.stderr, '');
  });
}
test('text failures go to stderr and describe the cause', () => {
  for (const [response, pattern] of [['401', /Authentication failed/], ['403', /Permission denied/], ['429', /limit/], ['network', /Connection failed/], ['timeout', /timed out/]]) {
    const result = run(['openai', fakeKey, '--timeout', '20'], { VALIDKEY_TEST_RESPONSE: response });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, pattern);
  }
});
test('stdin overrides the environment and accepts a trailing newline', () => {
  const result = json(['openai', '--stdin'], { OPENAI_API_KEY: 'ignored-key' }, ` ${fakeKey}\r\n`);
  assert.equal(result.status, 0);
  assert.equal(result.data.status, 'accepted');
});
test('stdin rejects empty, multiline, and oversized input', () => {
  for (const input of ['', ' \r\n', `${fakeKey}\nsecond-key`, 'x'.repeat(16385)]) {
    const result = json(['openai', '--stdin'], {}, input);
    assert.equal(result.status, 1);
    assert.equal(result.data.status, 'input_error');
  }
});
test('prompt fails safely without a terminal', () => {
  const result = run(['openai', '--prompt']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /requires a terminal/);
});
test('conflicting key sources and noninteractive prompt flags are rejected', () => {
  for (const args of [ ['--stdin', '--prompt'], [fakeKey, '--stdin'], [fakeKey, '--prompt'], ['--prompt'] ]) {
    const result = json(['openai', ...args]);
    assert.equal(result.status, 1);
    assert.equal(result.data.status, 'usage_error');
  }
  const quiet = run(['openai', '--prompt', '-q']);
  assert.equal(quiet.status, 1);
  assert.equal(quiet.stdout + quiet.stderr, '');
});
test('invalid timeout values are rejected without echoing their value', () => {
  for (const value of ['0', '-1', '1.5', '1e3', 'Infinity', '2147483648', fakeKey]) {
    const result = json(['openai', '--timeout', value]);
    assert.equal(result.status, 1);
    assert.equal(result.data.status, 'input_error');
  }
});
test('parser errors produce safe JSON and quiet errors stay silent', () => {
  for (const args of [[], ['--unknown'], ['openai', '--timeout'], ['openai', fakeKey, 'extra'], [`--${fakeKey}`]]) {
    const result = json(args);
    assert.equal(result.status, 1);
    assert.equal(result.data.status, args.includes('--timeout') ? 'input_error' : 'usage_error');
    const quiet = run([...args, '--quiet']);
    assert.equal(quiet.status, 1);
    assert.equal(quiet.stdout + quiet.stderr, '');
  }
});
