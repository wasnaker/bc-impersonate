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
exports.ImpersonateService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const impersonation_session_entity_1 = require("./infrastructure/persistence/relational/entities/impersonation-session.entity");
const impersonate_options_1 = require("./impersonate.options");
const START_PERMISSION = 'impersonate:start';
const READ_PERMISSION = 'read:impersonate';
const DEFAULT_TOKEN_LIFETIME_SECONDS = 1800;
let ImpersonateService = class ImpersonateService {
    sessions;
    options;
    constructor(sessions, options) {
        this.sessions = sessions;
        this.options = options;
    }
    get adapter() {
        if (!this.options)
            throw new common_1.ForbiddenException('Impersonation is not configured');
        return this.options;
    }
    async searchUsers(actorId, query, page = 1, limit = 20) {
        if (!(await this.adapter.authorize(actorId, READ_PERMISSION))) {
            throw new common_1.ForbiddenException();
        }
        const normalizedPage = Math.max(1, Math.floor(page));
        const normalizedLimit = Math.min(50, Math.max(1, Math.floor(limit)));
        const result = await this.adapter.searchUsers({
            query: query.trim(),
            page: normalizedPage,
            limit: normalizedLimit,
            excludeUserId: actorId,
        });
        return {
            data: result.data.map((user) => this.toSafeUser(user)),
            total: result.total,
            page: normalizedPage,
            limit: normalizedLimit,
        };
    }
    async start(input) {
        if (input.actorId === input.targetUserId) {
            throw new common_1.BadRequestException('You cannot impersonate your own account');
        }
        if (!(await this.adapter.authorize(input.actorId, START_PERMISSION))) {
            throw new common_1.ForbiddenException();
        }
        if (!(await this.adapter.validateActorSession(input.actorId, input.actorSessionId))) {
            throw new common_1.UnauthorizedException('The administrator session is no longer active');
        }
        const activeSession = await this.sessions.findOne({
            where: { actorSessionId: input.actorSessionId, status: 'active' },
        });
        if (activeSession && activeSession.expiresAt.getTime() > Date.now()) {
            throw new common_1.ConflictException('This administrator session is already impersonating another user');
        }
        if (activeSession) {
            await this.sessions.update({ id: activeSession.id, status: 'active' }, {
                status: 'expired',
                endedAt: new Date(),
                terminationReason: 'expired',
            });
        }
        const target = await this.adapter.findUserById(input.targetUserId);
        if (!target || !target.active)
            throw new common_1.NotFoundException('Target user is unavailable');
        if (!target.roles?.length)
            throw new common_1.BadRequestException('Target user has no assigned roles');
        const lifetime = Math.min(3600, Math.max(60, this.adapter.tokenLifetimeSeconds ?? DEFAULT_TOKEN_LIFETIME_SECONDS));
        const id = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + lifetime * 1000);
        const record = this.sessions.create({
            id,
            actorUserId: input.actorId,
            targetUserId: Number(target.id),
            actorSessionId: input.actorSessionId,
            status: 'active',
            reason: input.reason?.trim() || null,
            expiresAt,
            endedAt: null,
            endedByUserId: null,
            terminationReason: null,
        });
        try {
            await this.sessions.save(record);
        }
        catch (error) {
            // The partial unique index is the final guard against concurrent starts.
            if (error?.code === '23505') {
                throw new common_1.ConflictException('This administrator session is already impersonating another user');
            }
            throw error;
        }
        try {
            const token = await this.adapter.issueAccessToken({
                subjectUserId: target.id,
                subjectRoleIds: target.roles.map((role) => role.id),
                actorUserId: input.actorId,
                actorSessionId: input.actorSessionId,
                impersonationId: id,
                expiresInSeconds: lifetime,
            });
            return {
                impersonationId: id,
                accessToken: token.accessToken,
                expiresAt: token.expiresAt,
                actorUserId: input.actorId,
                subject: this.toSafeUser(target),
            };
        }
        catch (error) {
            await this.sessions.update({ id }, {
                status: 'revoked',
                endedAt: new Date(),
                terminationReason: 'token_issue_failed',
            });
            throw error;
        }
    }
    async stopWithRefreshToken(actorSessionId, refreshHash, impersonationId) {
        const actorSession = await this.adapter.resolveActorSession(actorSessionId, refreshHash);
        if (!actorSession)
            throw new common_1.UnauthorizedException('Invalid administrator refresh session');
        const actorId = Number(actorSession.actorId);
        if (!(await this.adapter.validateActorSession(actorId, actorSessionId))) {
            throw new common_1.UnauthorizedException('The administrator session is no longer active');
        }
        const record = await this.sessions.findOne({ where: { id: impersonationId } });
        if (!record || record.actorUserId !== actorId || record.actorSessionId !== actorSessionId) {
            throw new common_1.NotFoundException();
        }
        if (record.status !== 'active')
            return { stopped: true, alreadyStopped: true };
        const expired = record.expiresAt.getTime() <= Date.now();
        await this.sessions.update({ id: record.id, status: 'active' }, {
            status: expired ? 'expired' : 'stopped',
            endedAt: new Date(),
            endedByUserId: actorId,
            terminationReason: expired ? 'expired' : 'actor_requested',
        });
        return { stopped: true, impersonationId: record.id };
    }
    async renewWithRefreshToken(actorSessionId, refreshHash, impersonationId) {
        const actorSession = await this.adapter.resolveActorSession(actorSessionId, refreshHash);
        if (!actorSession)
            throw new common_1.UnauthorizedException('Invalid administrator refresh session');
        const actorId = Number(actorSession.actorId);
        if (!(await this.adapter.validateActorSession(actorId, actorSessionId))) {
            throw new common_1.UnauthorizedException('The administrator session is no longer active');
        }
        if (!(await this.adapter.authorize(actorId, START_PERMISSION))) {
            throw new common_1.ForbiddenException();
        }
        const record = await this.sessions.findOne({
            where: { id: impersonationId, actorUserId: actorId, actorSessionId, status: 'active' },
        });
        if (!record || record.expiresAt.getTime() <= Date.now()) {
            if (record) {
                await this.sessions.update({ id: record.id, status: 'active' }, {
                    status: 'expired',
                    endedAt: new Date(),
                    terminationReason: 'expired',
                });
            }
            throw new common_1.UnauthorizedException('Impersonation session has expired');
        }
        const target = await this.adapter.findUserById(record.targetUserId);
        if (!target || !target.active || !target.roles.length) {
            throw new common_1.UnauthorizedException('The impersonated account is no longer available');
        }
        const lifetime = Math.min(3600, Math.max(60, this.adapter.tokenLifetimeSeconds ?? DEFAULT_TOKEN_LIFETIME_SECONDS));
        const token = await this.adapter.issueAccessToken({
            subjectUserId: target.id,
            subjectRoleIds: target.roles.map((role) => role.id),
            actorUserId: actorId,
            actorSessionId,
            impersonationId: record.id,
            expiresInSeconds: lifetime,
        });
        await this.sessions.update({ id: record.id, status: 'active' }, { expiresAt: token.expiresAt });
        return { impersonationId: record.id, accessToken: token.accessToken, expiresAt: token.expiresAt };
    }
    async endForActorLogout(actorId, actorSessionId, impersonationId) {
        const record = await this.sessions.findOne({
            where: {
                id: impersonationId,
                actorUserId: actorId,
                actorSessionId,
                status: 'active',
            },
        });
        if (!record)
            return { ended: true, alreadyEnded: true };
        await this.sessions.update({ id: record.id, status: 'active' }, {
            status: 'revoked',
            endedAt: new Date(),
            endedByUserId: actorId,
            terminationReason: 'actor_logout',
        });
        return { ended: true, impersonationId: record.id };
    }
    async getCurrent(impersonationId, actorId, subjectId) {
        const record = await this.sessions.findOne({ where: { id: impersonationId } });
        if (!record ||
            record.status !== 'active' ||
            record.expiresAt.getTime() <= Date.now() ||
            record.actorUserId !== actorId ||
            record.targetUserId !== subjectId) {
            throw new common_1.UnauthorizedException('Impersonation session is no longer active');
        }
        return {
            impersonationId: record.id,
            actorUserId: record.actorUserId,
            targetUserId: record.targetUserId,
            startedAt: record.startedAt,
            expiresAt: record.expiresAt,
            reason: record.reason,
        };
    }
    /** Host refresh strategy must reject the actor refresh token while impersonation is active. */
    async assertActorSessionCanRefresh(actorSessionId) {
        const record = await this.sessions.findOne({
            where: { actorSessionId, status: 'active' },
        });
        if (record && record.expiresAt.getTime() > Date.now()) {
            throw new common_1.UnauthorizedException('Stop impersonation before refreshing the administrator session');
        }
        if (record) {
            await this.sessions.update({ id: record.id, status: 'active' }, {
                status: 'expired',
                endedAt: new Date(),
                terminationReason: 'expired',
            });
        }
    }
    /** Host JWT strategy must call this for every request carrying an impersonation claim. */
    async assertActiveToken(input) {
        const record = await this.sessions.findOne({
            where: { id: input.impersonationId, status: 'active' },
        });
        if (!record ||
            record.expiresAt.getTime() <= Date.now() ||
            record.actorUserId !== input.actorId ||
            record.targetUserId !== input.subjectId ||
            record.actorSessionId !== input.actorSessionId) {
            throw new common_1.UnauthorizedException('Invalid or expired impersonation context');
        }
        if (!(await this.adapter.validateActorSession(input.actorId, input.actorSessionId))) {
            throw new common_1.UnauthorizedException('The administrator session has been revoked');
        }
        if (!(await this.adapter.authorize(input.actorId, START_PERMISSION))) {
            throw new common_1.UnauthorizedException('The administrator is no longer authorized to impersonate');
        }
        const subject = await this.adapter.findUserById(input.subjectId);
        if (!subject || !subject.active) {
            throw new common_1.UnauthorizedException('The impersonated account is no longer active');
        }
        return subject.roles.map((role) => role.id);
    }
    toSafeUser(user) {
        return {
            id: user.id,
            email: user.email ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
        };
    }
};
exports.ImpersonateService = ImpersonateService;
exports.ImpersonateService = ImpersonateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(impersonation_session_entity_1.ImpersonationSessionEntity)),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(impersonate_options_1.IMPERSONATE_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], ImpersonateService);
