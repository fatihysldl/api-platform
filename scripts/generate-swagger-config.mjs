import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync
} from 'node:fs';

import { join } from 'node:path';

const root = process.cwd();

const zohoDir = join(root, 'zoho', 'crm', 'v8.0');

const zohoFiles = readdirSync(zohoDir)
  .filter((file) => file.endsWith('.json'))
  .sort();

const urls = [
  {
    url: 'specs/internal/cfx-internal.yaml',
    name: 'CFX Internal API'
  },

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
  `Zoho CRM definitions: ${zohoFiles.length}`
);
