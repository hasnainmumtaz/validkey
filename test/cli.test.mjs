import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const cli=fileURLToPath(new URL('../dist/index.js',import.meta.url));
const preload=fileURLToPath(new URL('./fixtures/mock-fetch.cjs',import.meta.url));
const fakeKey='fake-cli-test-key';
function run(args, overrides={}) {
  const env={...process.env,OPENAI_API_KEY:'',ANTHROPIC_API_KEY:'',NODE_OPTIONS:'',VALIDKEY_TEST_RESPONSE:'200',...overrides};
  const result=spawnSync(process.execPath,['--require',preload,cli,...args],{env,encoding:'utf8',timeout:5000,windowsHide:true});
  assert.equal(result.error,undefined);
  assert.equal(result.signal,null);
  assert.ok(!(result.stdout+result.stderr).includes(fakeKey),'Output must not expose the supplied key');
  return result;
}
test('help lists both providers without credentials',()=>{
  const result=run(['--help']); assert.equal(result.status,0); assert.match(result.stdout,/openai, anthropic/);
});
for(const [service,variable] of [['openai','OPENAI_API_KEY'],['anthropic','ANTHROPIC_API_KEY']]) {
  test(`${service}: reads the matching environment variable`,()=>{
    const result=run([service],{[variable]:fakeKey}); assert.equal(result.status,0); assert.equal(result.stdout.trim(),'Valid'); assert.equal(result.stderr,'');
  });
  test(`${service}: missing credential fails with the variable name`,()=>{
    const result=run([service]); assert.equal(result.status,1); assert.match(result.stderr,new RegExp(variable));
  });
}
test('service names are case-insensitive and a positional key takes precedence',()=>{
  const result=run(['OPENAI',fakeKey],{OPENAI_API_KEY:'fake-other-key'}); assert.equal(result.status,0);
});
test('unknown service fails clearly',()=>{
  const result=run(['unknown']); assert.equal(result.status,1); assert.match(result.stderr,/Unknown service: unknown/);
});
test('authentication errors produce a failed status and diagnostic',()=>{
  const result=run(['openai',fakeKey],{VALIDKEY_TEST_RESPONSE:'401'}); assert.equal(result.status,1); assert.match(result.stderr,/Invalid key or unauthorized/);
});
test('network errors remain distinguishable in diagnostic output',()=>{
  const result=run(['openai',fakeKey],{VALIDKEY_TEST_RESPONSE:'network'}); assert.equal(result.status,1); assert.match(result.stderr,/Simulated offline connection/);
});
for(const response of ['200','401','403','429','network']) {
  test(`quiet mode suppresses validation output for ${response}`,()=>{
    const result=run(['openai',fakeKey,'--quiet'],{VALIDKEY_TEST_RESPONSE:response});
    assert.equal(result.status,response==='200'?0:1); assert.equal(result.stdout,''); assert.equal(result.stderr,'');
  });
}
test('quiet mode suppresses missing-key and unknown-service messages',()=>{
  for(const args of [['openai','-q'],['unknown','-q']]) {
    const result=run(args); assert.equal(result.status,1); assert.equal(result.stdout+result.stderr,'');
  }
});
