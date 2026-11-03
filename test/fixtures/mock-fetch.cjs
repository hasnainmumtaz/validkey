// CLI tests preload this module so no real credentials or network are used.
globalThis.fetch = async (url, options) => {
  const expected = 'fake-cli-test-key';
  if (url === 'https://api.openai.com/v1/models') {
    if (options.headers.Authorization !== `Bearer ${expected}`) throw new Error('Unexpected test credential');
  } else if (url === 'https://api.anthropic.com/v1/models') {
    if (options.headers['x-api-key'] !== expected) throw new Error('Unexpected test credential');
  } else {
    throw new Error('Unexpected validation destination');
  }
  if (options.method !== 'GET' || options.redirect !== 'error') throw new Error('Unsafe request');
  const response = process.env.VALIDKEY_TEST_RESPONSE || '200';
  if (response === 'network') throw new Error(`Network exception includes ${expected}`);
  if (response === 'timeout') {
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error(expected)), { once: true }));
  }
  return new Response(expected, { status: Number(response), statusText: expected });
};
