import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough, Readable, Writable } from 'node:stream';
import { promptForKey, readKeyFromStdin } from '../dist/input.js';

function terminal(raw = false) {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = raw;
  input.setRawMode = value => { input.isRaw = value; return input; };
  let text = '';
  const output = new Writable({ write(chunk, _encoding, done) { text += chunk.toString(); done(); } });
  return { input, output, text: () => text };
}

async function withPrompt(send, { raw = false, expected, status } = {}) {
  const io = terminal(raw);
  const sigint = process.listenerCount('SIGINT');
  const sigterm = process.listenerCount('SIGTERM');
  const promise = promptForKey(io.input, io.output);
  assert.equal(io.input.isRaw, true);
  const assertion = status
    ? assert.rejects(promise, error => error.status === status)
    : promise.then(value => assert.equal(value, expected));
  send(io.input);
  await assertion;
  assert.equal(io.input.isRaw, raw, 'restore the previous terminal mode');
  assert.equal(io.input.listenerCount('keypress'), 0);
  assert.equal(process.listenerCount('SIGINT'), sigint);
  assert.equal(process.listenerCount('SIGTERM'), sigterm);
  assert.equal(io.text(), 'API key (hidden): \n', 'never echo typed or pasted input');
}

test('hidden entry accepts pasted text and restores cooked terminal mode', async () => {
  await withPrompt(input => input.write('fake-secret\r'), { expected: 'fake-secret' });
});
test('hidden entry supports backspace without showing the key', async () => {
  await withPrompt(input => input.write('fake-secrex\x7ft\r'), { expected: 'fake-secret' });
});
test('hidden entry supports clearing the line and ignores cursor keys', async () => {
  await withPrompt(input => input.write('wrong\x15fake-secret\x1b[D\r'), { expected: 'fake-secret' });
});
test('hidden entry preserves an already raw terminal', async () => {
  await withPrompt(input => input.write('fake-secret\r'), { raw: true, expected: 'fake-secret' });
});
for (const control of ['\x03', '\x04']) {
  test(`hidden entry restores mode on cancellation ${JSON.stringify(control)}`, async () => {
    await withPrompt(input => input.write(`fake-secret${control}`), { status: 'cancelled' });
  });
}
test('hidden entry restores mode on terminal error', async () => {
  await withPrompt(input => input.emit('error', new Error('fake-secret')), { status: 'input_error' });
});
test('hidden entry restores mode on input end', async () => {
  await withPrompt(input => input.end('fake-secret'), { status: 'input_error' });
});
test('hidden entry restores mode on oversize input', async () => {
  await withPrompt(input => input.write('x'.repeat(16385)), { status: 'input_error' });
});
test('hidden entry restores mode on a process interrupt', async () => {
  await withPrompt(() => process.emit('SIGINT'), { status: 'cancelled' });
});
test('stdin combines chunks and trims one line', async () => {
  assert.equal(await readKeyFromStdin(Readable.from(['  fake-', 'secret\r\n'])), 'fake-secret');
});
test('stdin rejects multiple keys and oversize input', async () => {
  for (const input of ['first\nsecond', 'x'.repeat(16385)]) {
    await assert.rejects(readKeyFromStdin(Readable.from([input])), error => error.status === 'input_error');
  }
});
test('stdin errors do not reveal exception details', async () => {
  const input = new Readable({ read() { this.destroy(new Error('fake-secret')); } });
  await assert.rejects(readKeyFromStdin(input), error => !error.message.includes('fake-secret'));
});
test('stdin refuses to echo input in an interactive terminal', async () => {
  await assert.rejects(readKeyFromStdin(terminal().input), /use --prompt/);
});

test('terminal mode is restored after the pending native read stops', async () => {
  const io = terminal();
  let nativeReadStopped = false;
  io.input.once('pause', () => process.nextTick(() => { nativeReadStopped = true; }));
  io.input.setRawMode = value => {
    if (!value) assert.equal(nativeReadStopped, true, 'restoring cooked mode too early can block Windows output');
    io.input.isRaw = value;
    return io.input;
  };
  const result = promptForKey(io.input, io.output);
  io.input.write('fake-secret\r');
  assert.equal(await result, 'fake-secret');
  assert.equal(io.input.isRaw, false);
});
