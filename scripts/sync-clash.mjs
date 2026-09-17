import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { isIP } from 'node:net';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { customRules } from './sync.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const upstreamRepo = 'https://github.com/Loyalsoldier/clash-rules.git';
const publicBase = 'https://raw.githubusercontent.com/corneliusztw/shadowrocket-rules/main';
export const providers = [
  ['private', 'domain', 'DIRECT'],
  ['direct', 'domain', 'DIRECT'], ['lancidr', 'ipcidr', 'DIRECT'],
  ['cncidr', 'ipcidr', 'DIRECT'],
];

export function convertRule(raw) {
  const fields = raw.split('#')[0].split(',').map(s => s.trim());
  let [type, target, policy, ...options] = fields;
  type = type.toUpperCase(); policy = policy?.toUpperCase();
  if (!['DOMAIN', 'DOMAIN-SUFFIX', 'DOMAIN-KEYWORD', 'IP-CIDR', 'IP-CIDR6', 'GEOIP'].includes(type) ||
      !['PROXY', 'DIRECT', 'REJECT'].includes(policy) || !target) throw new Error(`Unsupported Clash rule: ${raw}`);
  if (type.startsWith('IP-CIDR')) {
    const [ip, prefix, extra] = target.split('/');
    const family = isIP(ip);
    if (!family || extra !== undefined || !/^\d+$/.test(prefix ?? '') || Number(prefix) > (family === 4 ? 32 : 128) ||
        (type === 'IP-CIDR6' && family !== 6)) throw new Error(`Invalid CIDR: ${raw}`);
    type = family === 6 ? 'IP-CIDR6' : 'IP-CIDR';
  }
  if (options.length && (options.length !== 1 || options[0] !== 'no-resolve' || !['IP-CIDR', 'IP-CIDR6', 'GEOIP'].includes(type))) {
    throw new Error(`Unsupported Clash option: ${raw}`);
  }
  return [type, target, policy, ...options].join(',');
}

export function buildConfig(markdown) {
  const rules = [...new Set(customRules(markdown).map(convertRule))];
  const ruleProviders = {};
  for (const [name, behavior, policy] of providers) {
    const id = `ls-${name}`;
    ruleProviders[id] = {
      type: 'http', behavior,
      url: `${publicBase}/clash/providers/${name}.yaml`,
      path: `./ruleset/shadowrocket-rules/${name}.yaml`, interval: 86400,
    };
    // Resolve destination IPs when needed: otherwise CN IP-only destinations can miss DIRECT.
    rules.push(`RULE-SET,${id},${policy}`);
  }
  // The upstream lancidr/cncidr snapshots replace GEOIP downloads for reproducible validation.
  rules.push('MATCH,PROXY');
  return { 'rule-providers': ruleProviders, rules };
}

export function validatePayload(text, behavior) {
  const data = YAML.parse(text);
  if (!data || Object.keys(data).length !== 1 || !Array.isArray(data.payload) || !data.payload.length) {
    throw new Error('Expected non-empty YAML payload');
  }
  for (const value of data.payload) {
    if (typeof value !== 'string' || !value || /[\s,#]/.test(value)) throw new Error(`Invalid payload entry: ${value}`);
    if (behavior === 'ipcidr') {
      const [ip, prefix, extra] = value.split('/');
      const family = isIP(ip);
      if (!family || extra !== undefined || !/^\d+$/.test(prefix ?? '') || Number(prefix) > (family === 4 ? 32 : 128)) throw new Error(`Invalid CIDR payload: ${value}`);
    } else if (!/^[a-z0-9_.*+\-]+$/i.test(value)) throw new Error(`Invalid domain payload: ${value}`);
  }
  return data.payload.length;
}

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function save(path, text) {
  const target = resolve(root, path);
  try { if (await readFile(target, 'utf8') === text) return; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target + '.tmp', text, 'utf8');
  await rename(target + '.tmp', target);
}

async function main() {
  const markdown = await readFile(resolve(root, 'custom-rules.md'), 'utf8');
  const config = buildConfig(markdown);
  const refs = execFileSync('git', ['ls-remote', upstreamRepo, 'refs/heads/release', 'refs/heads/master'], { encoding: 'utf8', cwd: root });
  const shaFor = branch => {
    const sha = refs.split('\n').find(line => line.endsWith(`refs/heads/${branch}`))?.split(/\s+/)[0];
    if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error(`Missing ${branch} SHA`);
    return sha;
  };
  const revision = shaFor('release');
  const licenseRevision = shaFor('master');
  const results = await Promise.allSettled(providers.map(async ([name, behavior]) => {
    const url = `https://raw.githubusercontent.com/Loyalsoldier/clash-rules/${revision}/${name}.txt`;
    const text = await download(url);
    const count = validatePayload(text, behavior);
    return { name, behavior, count, url, text, sha256: createHash('sha256').update(text).digest('hex') };
  }));
  for (const result of results) if (result.status === 'rejected') throw result.reason;
  const snapshots = results.map(result => result.value);
  const license = await download(`https://raw.githubusercontent.com/Loyalsoldier/clash-rules/${licenseRevision}/LICENSE`);
  if (!license.includes('GNU GENERAL PUBLIC LICENSE')) throw new Error('Unexpected upstream license');
  // Publish only after every source and the generated config have passed validation.
  for (const snapshot of snapshots) await save(`clash/providers/${snapshot.name}.yaml`, snapshot.text);
  await save('clash/LICENSE-Loyalsoldier', license);
  await save('clash/upstream.json', JSON.stringify({ repository: upstreamRepo, revision, licenseRevision,
    files: snapshots.map(({ text, ...metadata }) => metadata) }, null, 2) + '\n');
  await save('clash-rules.yaml', '# Generated rules fragment; merge into an existing Clash/Mihomo config.\n# Requires a PROXY policy; contains no nodes or subscription credentials.\n# Source and license: clash/README.md. Custom rules take precedence.\n' + `# Loyalsoldier release revision: ${revision}\n` + YAML.stringify(config));
  console.log(`Clash: ${customRules(markdown).length} custom rules; ${snapshots.length} upstream sets; ${snapshots.reduce((n, s) => n + s.count, 0)} entries; revision ${revision}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
