import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.cwd();
const output = join(root, 'generated', 'postman');
mkdirSync(output, { recursive: true });

function convert(input, outputFile) {
  console.log(`Postman: ${input} -> ${outputFile}`);

  const args = [
    'openapi2postmanv2',
    '-s',
    input,
    '-o',
    outputFile,
    '-p'
  ];

  // Windows'ta Node.js v24 ile .cmd dosyalarını doğrudan spawn etmek
  // EINVAL hatasına neden olabildiği için npx'i cmd.exe üzerinden çalıştırıyoruz.
  if (process.platform === 'win32') {
    execFileSync('cmd.exe', [
      '/d',
      '/s',
      '/c',
      'npx',
      ...args
    ], {
      stdio: 'inherit'
    });
  } else {
    execFileSync('npx', args, {
      stdio: 'inherit'
    });
  }
}

convert(
  join(root, 'openapi', 'openapi.yaml'),
  join(output, 'company-api.postman_collection.json')
);

const zohoDir = join(root, 'vendor', 'zoho-crm', 'v8.0');

const files = readdirSync(zohoDir)
  .filter((f) => f.endsWith('.json'))
  .sort();

for (const file of files) {
  const name = basename(file, '.json');

  convert(
    join(zohoDir, file),
    join(output, `zoho-crm-v8-${name}.postman_collection.json`)
  );
}

console.log(`Generated ${files.length + 1} Postman collections.`);
