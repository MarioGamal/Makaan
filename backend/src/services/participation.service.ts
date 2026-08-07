import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  ParticipationClassificationSource,
  SellerProfile,
} from '../models/seller-profile.entity';

export type Participation = 'owner' | 'agent';
export type ParticipationReviewState = 'clear' | 'under_review' | 'suspended';
export type ParticipationVerificationState =
  'not_verified' | 'pending' | 'verified' | 'rejected' | 'expired';
export type PublicParticipationLabel =
  | 'declared_agent'
  | 'verified_owner'
  | 'owner_not_verified';

export interface ParticipationPolicyState {
  declaredParticipation: Participation;
  participationDeclarationVersion: number;
  agentDeclarationConfirmedVersion: number | null;
  moderatorParticipationOverride: Participation | null;
  reviewState: ParticipationReviewState;
  verificationState: ParticipationVerificationState;
}

export function deriveEffectiveParticipation(
  profile: ParticipationPolicyState,
): Participation {
  return (
    profile.moderatorParticipationOverride ?? profile.declaredParticipation
  );
}

export function derivePublicParticipationLabel(
  profile: ParticipationPolicyState,
): PublicParticipationLabel {
  if (deriveEffectiveParticipation(profile) === 'agent') {
    return 'declared_agent';
  }

  return profile.verificationState === 'verified'
    ? 'verified_owner'
    : 'owner_not_verified';
}

/** Risk automation can queue human review, but never reclassify or suspend a seller. */
export function applyRiskSignal<T extends ParticipationPolicyState>(
  profile: T,
): T {
  if (profile.reviewState === 'suspended') {
    return { ...profile };
  }

  return { ...profile, reviewState: 'under_review' };
}

export function changeDeclaredParticipation<T extends ParticipationPolicyState>(
  profile: T,
  declaration: Participation,
): T {
  if (profile.declaredParticipation === declaration) {
    return { ...profile };
  }

  return {
    ...profile,
    declaredParticipation: declaration,
    participationDeclarationVersion:
      profile.participationDeclarationVersion + 1,
    agentDeclarationConfirmedVersion: null,
  };
}

export function canPublishFirstAgentListing(
  profile: ParticipationPolicyState,
): boolean {
  if (deriveEffectiveParticipation(profile) !== 'agent') {
    return true;
  }

  return (
    profile.declaredParticipation === 'agent' &&
    profile.agentDeclarationConfirmedVersion ===
      profile.participationDeclarationVersion
  );
}

@Injectable()
export class ParticipationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(SellerProfile)
    private readonly sellerProfileRepository: Repository<SellerProfile>,
  ) {}

  deriveEffectiveParticipation(
    profile: ParticipationPolicyState,
  ): Participation {
    return deriveEffectiveParticipation(profile);
  }

  derivePublicParticipationLabel(
    profile: ParticipationPolicyState,
  ): PublicParticipationLabel {
    return derivePublicParticipationLabel(profile);
  }

  canPublishFirstAgentListing(profile: ParticipationPolicyState): boolean {
    return canPublishFirstAgentListing(profile);
  }

  async changeDeclaration(
    userId: string,
    declaration: Participation,
  ): Promise<SellerProfile> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(SellerProfile);
      const profile = await repository.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) {
        throw new NotFoundException('seller_profile_not_found');
      }

      const declarationChanged = profile.declaredParticipation !== declaration;
      Object.assign(
        profile,
        changeDeclaredParticipation(
          profile as unknown as ParticipationPolicyState,
          declaration,
        ),
      );
      if (declarationChanged) {
        profile.agentDeclarationConfirmedAt = null;
        profile.agentDeclarationConfirmedBy = null;
        profile.classificationSource =
          ParticipationClassificationSource.SELF_DECLARED;
      }
      return repository.save(profile);
    });
  }

  async queueRiskReview(userId: string): Promise<SellerProfile> {
    const profile = await this.sellerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('seller_profile_not_found');
    }

    Object.assign(
      profile,
      applyRiskSignal(profile as unknown as ParticipationPolicyState),
    );
    return this.sellerProfileRepository.save(profile);
  }

  async confirmCurrentAgentDeclaration(
    userId: string,
    moderatorId: string,
    confirmedAt = new Date(),
  ): Promise<SellerProfile> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(SellerProfile);
      const profile = await repository.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!profile) {
        throw new NotFoundException('seller_profile_not_found');
      }
      if (profile.declaredParticipation !== 'agent') {
        throw new BadRequestException('agent_declaration_required');
      }

      profile.agentDeclarationConfirmedVersion =
        profile.participationDeclarationVersion;
      profile.agentDeclarationConfirmedAt = confirmedAt;
      profile.agentDeclarationConfirmedBy = moderatorId;
      return repository.save(profile);
    });
  }
}
