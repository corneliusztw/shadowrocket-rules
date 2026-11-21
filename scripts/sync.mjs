import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const SOURCE = 'https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever/sr_cnip.conf';
const root = fileURLToPath(new URL('../', import.meta.url));

export function customRules(markdown) {
  const rules = [];
  let fence = null;
  let blocks = 0;
  for (const line of markdown.replace(/\r\n?/g, '\n').split('\n')) {
    const opening = line.match(/^```([^`]*)$/);
    if (opening) {
      if (fence !== null) {
        if (opening[1].trim()) throw new Error('Nested or unclosed Markdown fence');
        fence = null;
      } else {
        fence = opening[1].trim();
        if (fence === 'shadowrocket') blocks++;
      }
      continue;
    }
    if (fence !== 'shadowrocket') continue;
    const rule = line.trim();
    if (!rule || rule.startsWith('#')) continue;
    if (/^\[|^(FINAL|MATCH)\s*,/i.test(rule)) {
      throw new Error('Custom rules must not contain sections or catch-all FINAL/MATCH rules');
    }
    const fields = rule.split('#')[0].split(',').map(s => s.trim());
    if (fields.length < 3 || fields.some(s => !s) || !/^[A-Z][A-Z0-9-]*$/.test(fields[0])) {
      throw new Error(`Invalid custom rule: ${rule}`);
    }
    rules.push(rule);
  }
  if (fence !== null || blocks === 0) throw new Error('Expected closed shadowrocket code block');
  return [...new Set(rules)];
}

export function merge(upstream, markdown, general) {
  const text = upstream.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const sections = text.split(/(?=^\[[^\]\n]+\][ \t]*$)/m);
  const generalSections = sections.filter(s => /^\[General\][ \t]*$/m.test(s));
  const ruleSections = sections.filter(s => /^\[Rule\][ \t]*$/m.test(s));
  if (generalSections.length !== 1 || ruleSections.length !== 1 || /<html|<!doctype/i.test(text)) {
    throw new Error('Upstream is not a valid Shadowrocket config');
  }
  const ruleSection = ruleSections[0];
  if (!/^FINAL\s*,\s*\S+/im.test(ruleSection)) throw new Error('Upstream Rule section has no FINAL rule');
  if (general !== undefined) {
    const local = general.replace(/\r\n?/g, '\n').trimEnd();
    if (!local.startsWith('[General]\n') || /\n\[/.test(local)) throw new Error('Expected one local General section');
    sections[sections.indexOf(generalSections[0])] = local + '\n';
  }
  const rules = customRules(markdown);
  if (rules.length) {
    sections[sections.indexOf(ruleSection)] = ruleSection.replace('\n', () =>
      '\n# BEGIN CUSTOM RULES (custom-rules.md)\n' + rules.join('\n') + '\n# END CUSTOM RULES\n');
  }
  return sections.join('').trimEnd() + '\n';
}

export async function download() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function main() {
  const markdown = await readFile(resolve(root, 'custom-rules.md'), 'utf8');
  const general = await readFile(resolve(root, 'scripts/shadowrocket-general.conf'), 'utf8');
  const output = merge(await download(), markdown, general);
  const target = resolve(root, 'sr_cnip.conf');
  let previous;
  try { previous = await readFile(target, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous === output) { console.log('Config unchanged'); return; }
  await writeFile(target + '.tmp', output, 'utf8');
  await rename(target + '.tmp', target);
  console.log(`Updated sr_cnip.conf (${Buffer.byteLength(output)} bytes; ${customRules(markdown).length} custom rules)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
