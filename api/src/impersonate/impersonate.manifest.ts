export interface ModulePermissionDefinition {
  name: string;
  description: string;
}

export interface BackendModuleManifest {
  id: string;
  version: string;
  capabilities: readonly ('api' | 'web')[];
  permissions: readonly ModulePermissionDefinition[];
  requiresServices?: readonly { providerModuleId: string; contractId: string; version: string }[];
}

export const moduleManifest: BackendModuleManifest = {
  id: 'impersonate',
  version: '0.1.1',
  capabilities: ['api', 'web'],
  requiresServices: [{
    providerModuleId: 'core',
    contractId: 'core.authorization.registry',
    version: '^1.0.0',
  }],
  permissions: [
    { name: 'read:impersonate', description: 'Allows viewing impersonation controls and status' },
    { name: 'impersonate:start', description: 'Allows starting an impersonation session' },
  ],
};

export const impersonateModuleManifest = moduleManifest;
