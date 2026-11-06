import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
for (const key of ['./api', './api/manifest', './api/definition', './api/entities', './api/migrations', './api/seeds']) if (!pkg.exports[key]) throw new Error(`Missing package export: ${key}`);
for (const path of ['api/dist/index.js','api/dist/index.d.ts','api/dist/impersonate/impersonate.manifest.js','api/dist/impersonate/impersonate.definition.js','api/dist/impersonate/database/migrations/index.js']) await access(new URL(`../${path}`, import.meta.url), constants.R_OK);
console.log('Impersonate API package exports and build artifacts verified.');
