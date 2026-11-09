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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImpersonationSessionEntity = void 0;
const typeorm_1 = require("typeorm");
let ImpersonationSessionEntity = class ImpersonationSessionEntity {
    id;
    actorUserId;
    targetUserId;
    actorSessionId;
    status;
    reason;
    expiresAt;
    startedAt;
    updatedAt;
    endedAt;
    endedByUserId;
    terminationReason;
};
exports.ImpersonationSessionEntity = ImpersonationSessionEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ImpersonationSessionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], ImpersonationSessionEntity.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], ImpersonationSessionEntity.prototype, "targetUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer' }),
    __metadata("design:type", Number)
], ImpersonationSessionEntity.prototype, "actorSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16, default: 'active' }),
    __metadata("design:type", String)
], ImpersonationSessionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ImpersonationSessionEntity.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ImpersonationSessionEntity.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ImpersonationSessionEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ImpersonationSessionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], ImpersonationSessionEntity.prototype, "endedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], ImpersonationSessionEntity.prototype, "endedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: true }),
    __metadata("design:type", Object)
], ImpersonationSessionEntity.prototype, "terminationReason", void 0);
exports.ImpersonationSessionEntity = ImpersonationSessionEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'impersonation_session' }),
    (0, typeorm_1.Index)('IDX_impersonation_actor_status', ['actorUserId', 'status']),
    (0, typeorm_1.Index)('IDX_impersonation_expires_status', ['expiresAt', 'status'])
], ImpersonationSessionEntity);
