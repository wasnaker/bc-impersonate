"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleDefinition = void 0;
const impersonate_module_1 = require("./impersonate.module");
const impersonate_manifest_1 = require("./impersonate.manifest");
const impersonate_entities_1 = require("./impersonate.entities");
const migrations_1 = require("./database/migrations");
const impersonate_seeds_1 = require("./impersonate.seeds");
exports.moduleDefinition = {
    manifest: impersonate_manifest_1.moduleManifest,
    registerAsync: (options) => impersonate_module_1.ImpersonateModule.registerAsync(options),
    entities: impersonate_entities_1.moduleEntities,
    migrations: migrations_1.moduleMigrations,
    seedServices: impersonate_seeds_1.moduleSeedServices,
};
