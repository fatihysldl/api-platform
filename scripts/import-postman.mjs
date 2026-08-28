import { readdirSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import postmanToOpenApi from 'postman-to-openapi';

const root = process.cwd();

const inputDir = join(root, 'imports', 'postman');
const outputDir = join(root, 'generated', 'openapi', 'postman');

mkdirSync(outputDir, { recursive: true });

const files = readdirSync(inputDir)
  .filter((file) =>
    file.endsWith('.postman_collection.json') ||
    file.endsWith('.postman_collection')
  )
  .sort();

if (!files.length) {
  console.log('No Postman collections found.');
  process.exit(0);
}

for (const file of files) {
  const input = join(inputDir, file);

  const name = basename(file)
  .replace(/\.postman_collection\.json$/i, '')
  .replace(/\.postman_collection$/i, '');

  const output = join(outputDir, `${name}.yaml`);

  console.log(`Converting: ${file}`);

  await postmanToOpenApi(input, output, {
    defaultTag: 'General'
  });

  console.log(`Generated: ${output}`);
}

console.log(`Converted ${files.length} Postman collection(s) to OpenAPI.`);
