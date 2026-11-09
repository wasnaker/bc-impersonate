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
export declare const moduleManifest: BackendModuleManifest;
export declare const impersonateModuleManifest: BackendModuleManifest;
