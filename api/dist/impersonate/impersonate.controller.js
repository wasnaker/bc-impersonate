"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpersonateController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const start_impersonation_dto_1 = require("./dto/start-impersonation.dto");
const stop_impersonation_dto_1 = require("./dto/stop-impersonation.dto");
const impersonate_service_1 = require("./impersonate.service");
const impersonate_access_guard_1 = require("./impersonate-access.guard");
let ImpersonateController = class ImpersonateController {
    service;
    constructor(service) {
        this.service = service;
    }
    users(request, query = '', page = '1', limit = '20') {
        return this.service.searchUsers(request.user.id, query, Number(page), Number(limit));
    }
    start(request, dto) {
        return this.service.start({
            actorId: request.user.id,
            actorSessionId: request.user.sessionId,
            targetUserId: dto.targetUserId,
            reason: dto.reason,
        });
    }
    // Refresh credentials are accepted only for these two lifecycle operations.
    // The ordinary /auth/refresh endpoint rejects them while the record is active.
    stop(request, dto) {
        return this.service.stopWithRefreshToken(request.user.sessionId, request.user.hash, dto.impersonationId);
    }
    renew(request, dto) {
        return this.service.renewWithRefreshToken(request.user.sessionId, request.user.hash, dto.impersonationId);
    }
    current(request) {
        const payload = request.user;
        if (!payload.impersonationId || !payload.actorId)
            return { active: false };
        return this.service
            .getCurrent(payload.impersonationId, payload.actorId, payload.id)
            .then((session) => ({ active: true, ...session }));
    }
};
exports.ImpersonateController = ImpersonateController;
__decorate([
    (0, common_1.Get)('users'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ImpersonateController.prototype, "users", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_impersonation_dto_1.StartImpersonationDto]),
    __metadata("design:returntype", void 0)
], ImpersonateController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('stop'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt-refresh')),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, stop_impersonation_dto_1.StopImpersonationDto]),
    __metadata("design:returntype", void 0)
], ImpersonateController.prototype, "stop", null);
__decorate([
    (0, common_1.Post)('renew'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt-refresh')),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, stop_impersonation_dto_1.StopImpersonationDto]),
    __metadata("design:returntype", void 0)
], ImpersonateController.prototype, "renew", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ImpersonateController.prototype, "current", null);
exports.ImpersonateController = ImpersonateController = __decorate([
    (0, swagger_1.ApiTags)('Impersonate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(impersonate_access_guard_1.ImpersonateAccessGuard),
    (0, common_1.Controller)({ path: 'impersonate', version: '1' }),
    __metadata("design:paramtypes", [impersonate_service_1.ImpersonateService])
], ImpersonateController);
