// Loaded only by CLI tests. Prevent all real provider requests.
globalThis.fetch = async (url, options) => {
  const expected = 'fake-cli-test-key';
  if (url === 'https://api.openai.com/v1/models') {
    if (options.headers.Authorization !== `Bearer ${expected}`) throw new Error('Unexpected test credential');
  } else if (url === 'https://api.anthropic.com/v1/models') {
    if (options.headers['x-api-key'] !== expected) throw new Error('Unexpected test credential');
  } else {
    throw new Error('Unexpected validation destination');
  }
  if (options.method !== 'GET') throw new Error('Expected a read-only request');
  if (process.env.VALIDKEY_TEST_RESPONSE === 'network') throw new Error('Simulated offline connection');
  return new Response('{}', {status:Number(process.env.VALIDKEY_TEST_RESPONSE || 200)});
};
