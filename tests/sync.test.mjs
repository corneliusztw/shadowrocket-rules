import test from 'node:test';
import assert from 'node:assert/strict';
import { merge, customRules } from '../scripts/sync.mjs';

const upstream = '# attribution\n[General]\nipv6 = false\n[Rule]\nDOMAIN,a.example,PROXY\nFINAL,PROXY\n[MITM]\nhostname = example.com\n';
const md = rules => '# Notes\n```shadowrocket\n' + rules + '\n```\n';

test('empty custom rules preserve upstream', () => {
  assert.equal(merge(upstream, md('# comment')), upstream);
});
test('custom rules precede upstream and preserve other sections', () => {
  const rule = 'DOMAIN,a.example,DIRECT';
  const output = merge(upstream, md(rule));
  assert.ok(output.indexOf(rule) < output.indexOf('DOMAIN,a.example,PROXY'));
  assert.ok(output.endsWith('[MITM]\nhostname = example.com\n'));
  assert.ok(output.startsWith('# attribution\n'));
});
test('comments, prose and unrelated code are ignored; duplicates removed', () => {
  assert.deepEqual(customRules('```text\nignore\n```\n' + md('# comment\nDOMAIN,a.example,DIRECT\nDOMAIN,a.example,DIRECT')), ['DOMAIN,a.example,DIRECT']);
});
test('reject malformed or dangerous custom structure', () => {
  for (const rule of ['[Rule]', 'FINAL,DIRECT', 'MATCH,PROXY', 'DOMAIN,a.example', 'DOMAIN,,DIRECT']) {
    assert.throws(() => merge(upstream, md(rule)));
  }
  assert.throws(() => customRules('```shadowrocket\nDOMAIN,a.example,DIRECT'));
  assert.throws(() => customRules('missing block'));
});
test('reject HTML, missing FINAL, missing or duplicate sections', () => {
  for (const value of ['<html>error</html>', upstream.replace('FINAL,PROXY', ''), upstream.replace('[General]', '[Other]'), upstream + '[Rule]\nFINAL,DIRECT']) {
    assert.throws(() => merge(value, md('')));
  }
});
test('normalize Windows line endings and BOM', () => {
  assert.equal(merge('\uFEFF' + upstream.replaceAll('\n', '\r\n'), md('')), upstream);
});
test('multiple documented service groups merge in order and optional rules stay disabled', () => {
  const markdown = md('DOMAIN,first.example,PROXY') + '\nDocumentation between groups\n' +
    md('# DOMAIN,optional.example,PROXY') + '\n' + md('DOMAIN-SUFFIX,second.example,PROXY');
  assert.deepEqual(customRules(markdown), ['DOMAIN,first.example,PROXY', 'DOMAIN-SUFFIX,second.example,PROXY']);
  const output = merge(upstream, markdown);
  assert.ok(!output.includes('optional.example'));
  assert.ok(output.indexOf('first.example') < output.indexOf('second.example'));
  assert.ok(output.indexOf('second.example') < output.indexOf('DOMAIN,a.example,PROXY'));
});
