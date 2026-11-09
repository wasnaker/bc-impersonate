"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateImpersonationSession1793928000000 = void 0;
class CreateImpersonationSession1793928000000 {
    name = 'CreateImpersonationSession1793928000000';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "impersonation_session" (
        "id" varchar(36) NOT NULL,
        "actorUserId" integer NOT NULL,
        "targetUserId" integer NOT NULL,
        "actorSessionId" integer NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "reason" text,
        "expiresAt" timestamptz NOT NULL,
        "startedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "endedAt" timestamptz,
        "endedByUserId" integer,
        "terminationReason" varchar(32),
        CONSTRAINT "PK_impersonation_session" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query('CREATE INDEX "IDX_impersonation_actor_status" ON "impersonation_session" ("actorUserId", "status")');
        await queryRunner.query('CREATE INDEX "IDX_impersonation_expires_status" ON "impersonation_session" ("expiresAt", "status")');
        await queryRunner.query('CREATE UNIQUE INDEX "UQ_impersonation_actor_session_active" ON "impersonation_session" ("actorSessionId") WHERE "status" = \'active\'');
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE "impersonation_session"');
    }
}
exports.CreateImpersonationSession1793928000000 = CreateImpersonationSession1793928000000;
