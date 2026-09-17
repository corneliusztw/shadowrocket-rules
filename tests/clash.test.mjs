import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConfig, convertRule, validatePayload, providers } from '../scripts/sync-clash.mjs';
const md = text => '```shadowrocket\n' + text + '\n```\n';

test('Clash preserves custom exceptions before domestic direct rules without ad blocking', () => {
  const config = buildConfig(md('DOMAIN,api.example.com,DIRECT\nDOMAIN-SUFFIX,example.com,PROXY'));
  assert.deepEqual(config.rules.slice(0, 2), ['DOMAIN,api.example.com,DIRECT', 'DOMAIN-SUFFIX,example.com,PROXY']);
  assert.equal(config.rules.at(-1), 'MATCH,PROXY');
  assert.deepEqual(config.rules.slice(2), [
    'RULE-SET,ls-private,DIRECT', 'RULE-SET,ls-direct,DIRECT',
    'RULE-SET,ls-lancidr,DIRECT', 'RULE-SET,ls-cncidr,DIRECT', 'MATCH,PROXY',
  ]);
  assert.ok(!config.rules.some(rule => rule.endsWith(',REJECT')));
  assert.equal(Object.keys(config['rule-providers']).length, providers.length);
});
test('Clash converts IPv6 and rejects unsupported policies and options', () => {
  assert.equal(convertRule('IP-CIDR,2001:db8::/32,Proxy,no-resolve'), 'IP-CIDR6,2001:db8::/32,PROXY,no-resolve');
  for (const raw of ['IP-CIDR,1.2.3.4/33,PROXY', 'IP-CIDR6,1.2.3.4/24,PROXY', 'DOMAIN,x.example,CUSTOM', 'DOMAIN,x.example,PROXY,no-resolve', 'USER-AGENT,test,PROXY']) assert.throws(() => convertRule(raw));
});
test('Clash providers must be valid nonempty typed YAML payloads', () => {
  assert.equal(validatePayload("payload:\n  - '+.example.com'\n  - '*.example.net'\n", 'domain'), 2);
  assert.equal(validatePayload("payload:\n  - '2001:db8::/32'\n  - '10.0.0.0/8'\n", 'ipcidr'), 2);
  for (const value of ['<html>error</html>', 'payload: []', 'payload: [123]', 'payload: [example.com]\nextra: true', "payload: ['x.example,PROXY']"]) assert.throws(() => validatePayload(value, 'domain'));
  assert.throws(() => validatePayload('payload: [10.0.0.0/99]', 'ipcidr'));
});
test('Clash does not enable commented rules and every provider reference resolves', () => {
  const config = buildConfig(md('# DOMAIN,disabled.example,PROXY'));
  assert.equal(config.rules.length, providers.length + 1);
  for (const rule of config.rules.slice(0, -1)) {
    const provider = config['rule-providers'][rule.split(',')[1]];
    assert.equal(provider.interval, 86400);
    assert.ok(provider.url.startsWith('https://raw.githubusercontent.com/corneliusztw/shadowrocket-rules/main/clash/providers/'));
  }
});
