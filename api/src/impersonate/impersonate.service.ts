import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { ImpersonationSessionEntity } from './infrastructure/persistence/relational/entities/impersonation-session.entity';
import {
  IMPERSONATE_MODULE_OPTIONS,
  ImpersonateModuleOptions,
} from './impersonate.options';

const START_PERMISSION = 'impersonate:start';
const READ_PERMISSION = 'read:impersonate';
const DEFAULT_TOKEN_LIFETIME_SECONDS = 600;

@Injectable()
export class ImpersonateService {
  constructor(
    @InjectRepository(ImpersonationSessionEntity)
    private readonly sessions: Repository<ImpersonationSessionEntity>,
    @Optional()
    @Inject(IMPERSONATE_MODULE_OPTIONS)
    private readonly options?: ImpersonateModuleOptions,
  ) {}

  private get adapter(): ImpersonateModuleOptions {
    if (!this.options) throw new ForbiddenException('Impersonation is not configured');
    return this.options;
  }

  async searchUsers(actorId: number, query: string, page = 1, limit = 20) {
    if (!(await this.adapter.authorize(actorId, READ_PERMISSION))) {
      throw new ForbiddenException();
    }
    const normalizedPage = Math.max(1, Math.floor(page));
    const normalizedLimit = Math.min(50, Math.max(1, Math.floor(limit)));
    const result = await this.adapter.searchUsers({
      query: query.trim(),
      page: normalizedPage,
      limit: normalizedLimit,
    });
    return {
      data: result.data.map((user) => this.toSafeUser(user)),
      total: result.total,
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  async start(input: {
    actorId: number;
    actorSessionId: number;
    targetUserId: number;
    reason?: string;
  }) {
    if (input.actorId === input.targetUserId) {
      throw new BadRequestException('You cannot impersonate your own account');
    }
    if (!(await this.adapter.authorize(input.actorId, START_PERMISSION))) {
      throw new ForbiddenException();
    }
    if (!(await this.adapter.validateActorSession(input.actorId, input.actorSessionId))) {
      throw new UnauthorizedException('The administrator session is no longer active');
    }

    const target = await this.adapter.findUserById(input.targetUserId);
    if (!target || !target.active) throw new NotFoundException('Target user is unavailable');
    if (!target.roles?.length) throw new BadRequestException('Target user has no assigned roles');

    const lifetime = Math.min(
      900,
      Math.max(60, this.adapter.tokenLifetimeSeconds ?? DEFAULT_TOKEN_LIFETIME_SECONDS),
    );
    const id = randomUUID();
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

    await this.sessions.save(record);
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
    } catch (error) {
      await this.sessions.update({ id }, {
        status: 'revoked',
        endedAt: new Date(),
        terminationReason: 'token_issue_failed',
      });
      throw error;
    }
  }

  async stop(actorId: number, actorSessionId: number, impersonationId: string) {
    const record = await this.sessions.findOne({ where: { id: impersonationId } });
    if (!record || record.actorUserId !== actorId) throw new NotFoundException();
    if (record.actorSessionId !== actorSessionId) throw new ForbiddenException();
    if (record.status !== 'active') return { stopped: true, alreadyStopped: true };
    await this.sessions.update({ id: record.id, status: 'active' }, {
      status: 'stopped',
      endedAt: new Date(),
      endedByUserId: actorId,
      terminationReason: 'actor_requested',
    });
    return { stopped: true, impersonationId: record.id };
  }

  async getCurrent(impersonationId: string, actorId: number, subjectId: number) {
    const record = await this.sessions.findOne({ where: { id: impersonationId } });
    if (
      !record ||
      record.status !== 'active' ||
      record.expiresAt.getTime() <= Date.now() ||
      record.actorUserId !== actorId ||
      record.targetUserId !== subjectId
    ) {
      throw new UnauthorizedException('Impersonation session is no longer active');
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

  /** Host JWT strategy must call this for every request carrying an impersonation claim. */
  async assertActiveToken(input: {
    impersonationId: string;
    actorId: number;
    subjectId: number;
    actorSessionId: number;
  }): Promise<void> {
    const record = await this.sessions.findOne({
      where: { id: input.impersonationId, status: 'active' },
    });
    if (
      !record ||
      record.expiresAt.getTime() <= Date.now() ||
      record.actorUserId !== input.actorId ||
      record.targetUserId !== input.subjectId ||
      record.actorSessionId !== input.actorSessionId
    ) {
      throw new UnauthorizedException('Invalid or expired impersonation context');
    }
    if (!(await this.adapter.validateActorSession(input.actorId, input.actorSessionId))) {
      throw new UnauthorizedException('The administrator session has been revoked');
    }
  }

  private toSafeUser(user: {
    id: number | string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }) {
    return {
      id: user.id,
      email: user.email ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    };
  }
}
