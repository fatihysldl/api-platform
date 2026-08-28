import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync
} from 'node:fs';

import { join, basename } from 'node:path';
import YAML from 'yaml';

const root = process.cwd();

const inputDir = join(root, 'generated', 'openapi', 'postman');
const outputFile = join(root, 'generated', 'openapi', 'cfx-internal.yaml');

const httpMethods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace'
]);

function formatName(file) {
  return basename(file)
    .replace(/\.(yaml|yml)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Rename component references so different collections cannot overwrite each other.
function rewriteRefs(value, prefix) {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteRefs(item, prefix));
  }

  if (value && typeof value === 'object') {
    const result = {};

    for (const [key, item] of Object.entries(value)) {
      if (
        key === '$ref' &&
        typeof item === 'string' &&
        item.startsWith('#/components/')
      ) {
        const parts = item.split('/');

        if (parts.length >= 4) {
          const section = parts[2];
          const componentName = parts.slice(3).join('/');

          result[key] =
            `#/components/${section}/${prefix}_${componentName}`;
        } else {
          result[key] = item;
        }
      } else {
        result[key] = rewriteRefs(item, prefix);
      }
    }

    return result;
  }

  return value;
}

if (!existsSync(inputDir)) {
  console.log('No generated Postman OpenAPI directory found.');
  process.exit(0);
}

const files = readdirSync(inputDir)
  .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
  .sort();

const merged = {
  openapi: '3.0.3',

  info: {
    title: 'CFX Internal API',
    version: '1.0.0',
    description:
      'API definitions automatically generated from Postman collections.'
  },

  tags: [],
  paths: {},
  components: {}
};

for (const file of files) {
  const filePath = join(inputDir, file);

  const document = YAML.parse(
    readFileSync(filePath, 'utf8')
  );

  const collectionName = basename(file)
  .replace(/\.postman_collection\.json$/i, '')
  .replace(/\.(yaml|yml)$/i, '');

  const safePrefix = collectionName
    .replace(/[^a-zA-Z0-9]/g, '_');

  console.log(`Merging: ${collectionName}`);

  merged.tags.push({
    name: collectionName,
    description: `Imported from ${file}`
  });

  // Merge all paths from the collection.
  for (const [pathName, originalPathItem] of Object.entries(
    document.paths || {}
  )) {
    const pathItem = rewriteRefs(
      originalPathItem,
      safePrefix
    );

    if (!merged.paths[pathName]) {
      merged.paths[pathName] = {};
    }

    for (const [key, value] of Object.entries(pathItem)) {
      if (!httpMethods.has(key.toLowerCase())) {
        if (!(key in merged.paths[pathName])) {
          merged.paths[pathName][key] = value;
        }

        continue;
      }

      const method = key.toLowerCase();

      // OpenAPI cannot contain two identical path + method combinations.
      if (merged.paths[pathName][method]) {
        throw new Error(
          `Duplicate endpoint detected: ${method.toUpperCase()} ${pathName}. ` +
          `Conflict while importing ${collectionName}.`
        );
      }

      const operation = value || {};

      // Group every endpoint under its Postman collection name.
      operation.tags = [collectionName];

      // Preserve the server URL belonging to this collection.
      if (
        !operation.servers &&
        Array.isArray(document.servers) &&
        document.servers.length > 0
      ) {
        operation.servers = document.servers;
      }

      merged.paths[pathName][method] = operation;
    }
  }

  // Merge components and namespace them by collection.
  for (const [section, definitions] of Object.entries(
    document.components || {}
  )) {
    if (!merged.components[section]) {
      merged.components[section] = {};
    }

    for (const [name, definition] of Object.entries(
      definitions || {}
    )) {
      merged.components[section][`${safePrefix}_${name}`] =
        rewriteRefs(definition, safePrefix);
    }
  }
}

if (Object.keys(merged.components).length === 0) {
  delete merged.components;
}

mkdirSync(join(root, 'generated', 'openapi'), {
  recursive: true
});

writeFileSync(
  outputFile,
  YAML.stringify(merged),
  'utf8'
);

console.log('');
console.log(
  `CFX Internal API generated from ${files.length} Postman collection(s).`
);

console.log(`Generated: ${outputFile}`);
