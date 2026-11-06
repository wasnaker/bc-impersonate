export interface ModulePermissionDefinition {
  name: string;
  description: string;
}

export interface BackendModuleManifest {
  id: string;
  version: string;
  capabilities: readonly ('api' | 'web')[];
  permissions: readonly ModulePermissionDefinition[];
}

export const moduleManifest: BackendModuleManifest = {
  id: 'impersonate',
  version: '0.1.0',
  capabilities: ['api', 'web'],
  permissions: [
    { name: 'read:impersonate', description: 'Allows viewing impersonation controls and status' },
    { name: 'impersonate:start', description: 'Allows starting an impersonation session' },
  ],
};

export const impersonateModuleManifest = moduleManifest;
