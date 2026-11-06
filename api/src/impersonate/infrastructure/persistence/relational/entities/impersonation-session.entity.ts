import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'impersonation_session' })
@Index('IDX_impersonation_actor_status', ['actorUserId', 'status'])
@Index('IDX_impersonation_expires_status', ['expiresAt', 'status'])
export class ImpersonationSessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'integer' })
  actorUserId: number;

  @Column({ type: 'integer' })
  targetUserId: number;

  @Column({ type: 'integer' })
  actorSessionId: number;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: 'active' | 'stopped' | 'expired' | 'revoked';

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  startedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'integer', nullable: true })
  endedByUserId: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  terminationReason: string | null;
}
