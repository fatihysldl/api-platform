# API Platform Starter

A team API catalog built around OpenAPI as the source of truth. It contains your own API specification and can synchronize the official Zoho CRM v8 OAS repository.

## Architecture

- `openapi/openapi.yaml` — your internal/company API source of truth.
- `vendor/zoho-crm/v8.0/*.json` — synchronized, unmodified Zoho CRM OAS files.
- `swagger/swagger-config.json` — generated Swagger UI selector containing both internal and Zoho APIs.
- `generated/postman/` — generated Postman collections, one for your API and one per Zoho OAS resource file.
- `generated/sdk/` — generated SDKs.

Do not manually edit `vendor/zoho-crm`. Update it with `npm run sync:zoho`.

## Requirements

- Node.js 20+ (22 recommended)
- npm
- Git
- Docker Desktop (only required for local Swagger UI)

## First run

```bash
npm install
npm run generate
```

`npm run generate` performs:

1. Validation of your internal OpenAPI file.
2. Clone/sync of the official `zoho/crm-oas` repository.
3. Basic structural validation of every Zoho CRM v8 OAS JSON file.
4. Generation of Swagger UI's multi-document configuration.
5. Generation of Postman collections.

## Open Swagger UI

```bash
npm run docs
```

Open `http://localhost:8080`.

The definition selector at the top of Swagger UI will contain:

- Company / Internal API
- Zoho CRM v8 resource specifications such as Records, Modules, etc.

Zoho files are intentionally not merged into one synthetic OpenAPI file. Zoho publishes resource-specific OAS documents and keeping them unchanged makes updates safer and traceable.

## Refresh Zoho CRM specifications

```bash
npm run sync:zoho
npm run validate:zoho
npm run swagger:config
npm run postman
```

Or:

```bash
npm run generate
```

The exact upstream commit used in the last synchronization is saved to:

```text
vendor/zoho-crm/SOURCE.json
```

## Postman

Generate all collections:

```bash
npm run postman
```

Outputs include:

```text
generated/postman/company-api.postman_collection.json
generated/postman/zoho-crm-v8-record.postman_collection.json
generated/postman/zoho-crm-v8-modules.postman_collection.json
...
```

Because the script enumerates every `.json` file in Zoho's `v8.0` directory, a newly published Zoho resource specification is automatically included after the next sync without adding its filename to our code.

## SDK generation

Your internal API:

```bash
npm run sdk:typescript
npm run sdk:csharp
```

Example Zoho Records TypeScript SDK:

```bash
npm run sdk:zoho:record:typescript
```

For production use, generate only the Zoho resource SDKs the project actually needs rather than generating every resource for every language.

## CI

`.github/workflows/openapi.yml` runs on pushes, pull requests, manual execution, and once per day. It downloads the current official Zoho OAS, validates the files and builds Swagger/Postman artifacts.

The scheduled job currently detects/builds against changes but does not commit vendor updates back to the repository. If desired, add a second workflow that opens a pull request whenever `vendor/zoho-crm` differs from the repository version.

## How to add your own endpoint

Edit only `openapi/openapi.yaml`, for example:

```yaml
paths:
  /contracts/{id}:
    get:
      summary: Get contract
      operationId: getContractById
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Contract found
```

Then run:

```bash
npm run validate
npm run postman
npm run swagger:config
```

Swagger and Postman are generated from the same contract, so they do not need to be documented independently.

## Zoho-specific note

Zoho CRM OAS definitions are generic. Module-specific custom fields and organization-specific business rules are not fully represented by the official files. Keep organization-specific wrappers, schemas or APIs in your own `openapi/openapi.yaml` rather than editing the synchronized Zoho vendor files.
