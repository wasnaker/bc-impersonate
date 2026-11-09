"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ImpersonateModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpersonateModule = exports.IMPERSONATE_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const impersonation_session_entity_1 = require("./infrastructure/persistence/relational/entities/impersonation-session.entity");
const impersonate_controller_1 = require("./impersonate.controller");
const impersonate_service_1 = require("./impersonate.service");
const impersonate_access_guard_1 = require("./impersonate-access.guard");
const impersonate_options_1 = require("./impersonate.options");
exports.IMPERSONATE_SERVICE = Symbol.for('@wasnaker/module-impersonate/service');
let ImpersonateModule = ImpersonateModule_1 = class ImpersonateModule {
    static registerAsync(options) {
        const optionsProvider = {
            provide: impersonate_options_1.IMPERSONATE_MODULE_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject ?? [],
        };
        return {
            module: ImpersonateModule_1,
            imports: options.imports ?? [],
            providers: [optionsProvider],
        };
    }
};
exports.ImpersonateModule = ImpersonateModule;
exports.ImpersonateModule = ImpersonateModule = ImpersonateModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([impersonation_session_entity_1.ImpersonationSessionEntity])],
        controllers: [impersonate_controller_1.ImpersonateController],
        providers: [
            impersonate_service_1.ImpersonateService,
            impersonate_access_guard_1.ImpersonateAccessGuard,
            { provide: exports.IMPERSONATE_SERVICE, useExisting: impersonate_service_1.ImpersonateService },
        ],
        exports: [impersonate_service_1.ImpersonateService, exports.IMPERSONATE_SERVICE],
    })
], ImpersonateModule);
