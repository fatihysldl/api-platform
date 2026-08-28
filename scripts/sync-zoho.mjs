import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const repository = 'https://github.com/zoho/crm-oas.git';
const target = join(root, 'zoho', 'crm');

const tempRoot = join(root, '.tmp');

mkdirSync(tempRoot, {
  recursive: true
});

// Create a unique temporary directory for every sync.
// This avoids Windows/OneDrive locking problems between runs.
const tempRepo = mkdtempSync(
  join(tempRoot, 'zoho-crm-sync-')
);

const tempGitDir = join(tempRepo, '.git');

function runGit(args, options = {}) {
  return execFileSync(
    'git',
    args,
    {
      stdio: 'inherit',
      ...options
    }
  );
}

console.log('Syncing official Zoho CRM OAS repository...');
console.log('Cloning latest Zoho CRM OAS repository...');

try {

  // Clone the latest official Zoho CRM OAS repository.
  runGit([
    'clone',
    '--depth',
    '1',
    '--branch',
    'main',
    repository,
    tempRepo
  ]);

  // Get the exact upstream commit.
  const commit = execFileSync(
    'git',
    [
      '-C',
      tempRepo,
      'rev-parse',
      'HEAD'
    ],
    {
      encoding: 'utf8'
    }
  ).trim();

  console.log(`Zoho commit: ${commit}`);

  // Remove previously synchronized Zoho files.
  rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 300
  });

  mkdirSync(target, {
    recursive: true
  });

  // Copy only the tracked Zoho repository files into zoho/crm.
  // The nested .git directory remains inside the temporary folder.
  runGit([
    `--git-dir=${tempGitDir}`,
    `--work-tree=${target}`,
    'checkout',
    '-f',
    'HEAD',
    '--',
    '.'
  ], {
    cwd: tempRepo
  });

  // Store only information that changes when Zoho actually changes.
  writeFileSync(
    join(target, 'SOURCE.json'),
    JSON.stringify(
      {
        repository: 'https://github.com/zoho/crm-oas',
        branch: 'main',
        commit
      },
      null,
      2
    ) + '\n'
  );

  console.log('');
  console.log('Zoho CRM OAS sync completed successfully.');
  console.log(`Commit: ${commit}`);
  console.log(`Target: ${target}`);

} finally {

  // Best-effort cleanup of the temporary clone.
  // A failed cleanup must not break future syncs because every run uses
  // a unique temporary directory.
  try {
    rmSync(tempRepo, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 300
    });
  } catch (error) {
    console.warn(`Temporary directory could not be removed: ${tempRepo}`);
  }
}
