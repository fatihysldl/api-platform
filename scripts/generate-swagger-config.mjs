import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync
} from 'node:fs';
import { join, basename } from 'node:path';

const root = process.cwd();

const zohoDir = join(root, 'zoho', 'crm', 'v8.0');
const postmanDir = join(root, 'generated', 'openapi', 'postman');

const zohoFiles = readdirSync(zohoDir)
  .filter((file) => file.endsWith('.json'))
  .sort();

const postmanFiles = existsSync(postmanDir)
  ? readdirSync(postmanDir)
      .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
      .sort()
  : [];

function formatName(file) {
  return basename(file)
    .replace(/\.(yaml|yml)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const urls = [
  {
    url: 'specs/internal/openapi.yaml',
    name: 'CFX Internal API'
  },

  // Add OpenAPI files generated automatically from Postman collections.
  ...postmanFiles.map((file) => ({
    url: `specs/postman/${file}`,
    name: formatName(file)
  })),

  // Add the official Zoho CRM v8 OpenAPI definitions.
  ...zohoFiles.map((file) => {
    let title = file;

    try {
      title =
        JSON.parse(
          readFileSync(join(zohoDir, file), 'utf8')
        ).info?.title || file;
    } catch {}

    return {
      url: `specs/zoho/${file}`,
      name: `Zoho CRM v8 - ${title}`
    };
  })
];

mkdirSync(join(root, 'swagger'), {
  recursive: true
});

writeFileSync(
  join(root, 'swagger', 'swagger-config.json'),
  JSON.stringify(
    {
      urls,
      'urls.primaryName': 'CFX Internal API',
      deepLinking: true,
      displayRequestDuration: true,
      persistAuthorization: true
    },
    null,
    2
  ) + '\n'
);

console.log(
  `Swagger selector generated with ${urls.length} API definitions.`
);

console.log(
  `Postman imports: ${postmanFiles.length}`
);

console.log(
  `Zoho CRM definitions: ${zohoFiles.length}`
);
