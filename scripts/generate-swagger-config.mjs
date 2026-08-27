import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const zohoDir = join(root, 'vendor', 'zoho-crm', 'v8.0');
const files = readdirSync(zohoDir).filter((f) => f.endsWith('.json')).sort();

const urls = [
  { url: '/specs/internal/openapi.yaml', name: 'Company / Internal API' },
  ...files.map((file) => {
    let title = file;
    try {
      title = JSON.parse(readFileSync(join(zohoDir, file), 'utf8')).info?.title || file;
    } catch {}
    return { url: `/specs/zoho/${file}`, name: `Zoho CRM v8 - ${title}` };
  })
];

mkdirSync(join(root, 'swagger'), { recursive: true });
writeFileSync(join(root, 'swagger', 'swagger-config.json'), JSON.stringify({
  urls,
  'urls.primaryName': 'Company / Internal API',
  deepLinking: true,
  displayRequestDuration: true,
  persistAuthorization: true
}, null, 2) + '\n');
console.log(`Swagger selector generated with ${urls.length} API definitions.`);
