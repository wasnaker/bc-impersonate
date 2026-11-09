"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impersonateModuleManifest = exports.moduleManifest = void 0;
exports.moduleManifest = {
    id: 'impersonate',
    version: '0.1.0',
    capabilities: ['api', 'web'],
    permissions: [
        { name: 'read:impersonate', description: 'Allows viewing impersonation controls and status' },
        { name: 'impersonate:start', description: 'Allows starting an impersonation session' },
    ],
};
exports.impersonateModuleManifest = exports.moduleManifest;
