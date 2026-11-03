import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOpenAI} from '../dist/validators/openai.js';
import {validateAnthropic} from '../dist/validators/anthropic.js';

const providers = [
  {name:'OpenAI',validate:validateOpenAI,url:'https://api.openai.com/v1/models',headers:{Authorization:'Bearer fake-test-key'}},
  {name:'Anthropic',validate:validateAnthropic,url:'https://api.anthropic.com/v1/models',headers:{'x-api-key':'fake-test-key','anthropic-version':'2023-06-01'}},
];
for (const provider of providers) {
  test(`${provider.name}: success makes one read-only request to the correct provider`,async t=>{
    const fetch=t.mock.method(globalThis,'fetch',async(url,options)=>{
      assert.equal(url,provider.url);
      assert.equal(options.method,'GET');
      assert.equal(options.body,undefined);
      for(const [name,value] of Object.entries(provider.headers)) assert.equal(options.headers[name],value);
      return new Response('{}',{status:200});
    });
    assert.deepEqual(await provider.validate('  fake-test-key  '),{valid:true});
    assert.equal(fetch.mock.callCount(),1);
  });
  test(`${provider.name}: empty credentials never reach the network`,async t=>{
    const fetch=t.mock.method(globalThis,'fetch',async()=>{throw new Error('Network must not be called');});
    for(const value of ['', '   ']) assert.deepEqual(await provider.validate(value),{valid:false,message:'Key is empty'});
    assert.equal(fetch.mock.callCount(),0);
  });
  for(const [status,message] of [[401,'Invalid key or unauthorized'],[403,'Forbidden'],[429,'Unexpected response: 429 Too Many Requests'],[503,'Unexpected response: 503 Service Unavailable']]) {
    test(`${provider.name}: HTTP ${status} retains its diagnostic`,async t=>{
      t.mock.method(globalThis,'fetch',async()=>new Response(null,{status,statusText:status===429?'Too Many Requests':status===503?'Service Unavailable':''}));
      assert.deepEqual(await provider.validate('fake-test-key'),{valid:false,message});
    });
  }
  test(`${provider.name}: network failure is not reported as accepted`,async t=>{
    t.mock.method(globalThis,'fetch',async()=>{throw new Error('Simulated connection failure');});
    assert.deepEqual(await provider.validate('fake-test-key'),{valid:false,message:'Simulated connection failure'});
  });
}
