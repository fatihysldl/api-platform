import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const target = join(root, 'vendor', 'zoho-crm');
const gitDir = join(target, '.git');
const repository = 'https://github.com/zoho/crm-oas.git';

function runGit(args) {
  execFileSync(
    'git',
    args,
    {
      stdio: 'inherit'
    }
  );
}

console.log('Syncing official Zoho CRM OAS repository...');

if (existsSync(gitDir)) {

  // Repo daha önce clone edildiyse sadece Zoho'daki en güncel değişiklikleri çeker.
  console.log('Existing Zoho CRM OAS repository found.');

  runGit([
    '-C',
    target,
    'fetch',
    '--depth',
    '1',
    'origin',
    'main'
  ]);

  // Local dosyaları resmi Zoho main branch ile tamamen eşitler.
  runGit([
    '-C',
    target,
    'reset',
    '--hard',
    'origin/main'
  ]);

  // Zoho reposunda artık bulunmayan eski/untracked dosyaları temizler.
  runGit([
    '-C',
    target,
    'clean',
    '-fd'
  ]);

} else {

  // İlk kurulumda resmi Zoho CRM OAS repository'sini clone eder.
  console.log('Zoho CRM OAS repository not found. Cloning...');

  runGit([
    'clone',
    '--depth',
    '1',
    '--branch',
    'main',
    repository,
    target
  ]);
}

// Kullanılan Zoho commit bilgisini alır.
const commit = execFileSync(
  'git',
  [
    '-C',
    target,
    'rev-parse',
    'HEAD'
  ],
  {
    encoding: 'utf8'
  }
).trim();

// Hangi Zoho OAS sürümünün kullanıldığını kayıt altına alır.
writeFileSync(
  join(target, 'SOURCE.json'),
  JSON.stringify(
    {
      repository: 'https://github.com/zoho/crm-oas',
      branch: 'main',
      commit,
      syncedAt: new Date().toISOString()
    },
    null,
    2
  ) + '\n'
);

console.log('');
console.log('Zoho CRM OAS sync completed successfully.');
console.log(`Commit: ${commit}`);
