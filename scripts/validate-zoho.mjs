import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'vendor', 'zoho-crm', 'v8.0');
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
if (!files.length) throw new Error('No Zoho OAS JSON files found. Run npm run sync:zoho first.');

let failed = false;
for (const file of files) {
  try {
    const doc = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    if (!doc.openapi || !doc.info || !doc.paths) throw new Error('Missing required OpenAPI top-level keys');
    console.log(`OK  ${file}  OpenAPI ${doc.openapi}`);
  } catch (error) {
    failed = true;
    console.error(`ERR ${file}: ${error.message}`);
  }
}
if (failed) process.exit(1);
console.log(`Validated ${files.length} Zoho OAS files.`);
