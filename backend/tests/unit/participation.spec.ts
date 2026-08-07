import { describe, expect, it } from '@jest/globals';

type Participation = 'owner' | 'agent';
type VerificationState =
  'not_verified' | 'pending' | 'verified' | 'rejected' | 'expired';
type ReviewState = 'clear' | 'under_review' | 'suspended';

type ParticipationProfile = {
  declaredParticipation: Participation;
  participationDeclarationVersion: number;
  agentDeclarationConfirmedVersion: number | null;
  moderatorParticipationOverride: Participation | null;
  reviewState: ReviewState;
  verificationState: VerificationState;
};

type ParticipationPolicy = {
  deriveEffectiveParticipation(profile: ParticipationProfile): Participation;
  derivePublicParticipationLabel(
    profile: ParticipationProfile,
  ): 'agent' | 'verified_owner' | 'owner_not_verified';
  applyRiskSignal(profile: ParticipationProfile): ParticipationProfile;
  changeDeclaredParticipation(
    profile: ParticipationProfile,
    declaration: Participation,
  ): ParticipationProfile;
  canPublishFirstAgentListing(profile: ParticipationProfile): boolean;
};

/**
 * T021 must export this pure policy surface. A dynamic require lets this specification type-check before
 * the new service exists while deliberately failing red until the implementation provides the contract.
 */
function participationPolicy(): ParticipationPolicy {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../src/services/participation.service') as ParticipationPolicy;
}

function profile(
  overrides: Partial<ParticipationProfile> = {},
): ParticipationProfile {
  return {
    declaredParticipation: 'owner',
    participationDeclarationVersion: 1,
    agentDeclarationConfirmedVersion: null,
    moderatorParticipationOverride: null,
    reviewState: 'clear',
    verificationState: 'not_verified',
    ...overrides,
  };
}

describe('participation policy', () => {
  it('uses a human moderator override as the effective participation over the seller declaration', () => {
    const policy = participationPolicy();

    expect(
      policy.deriveEffectiveParticipation(
        profile({
          declaredParticipation: 'owner',
          moderatorParticipationOverride: 'agent',
        }),
      ),
    ).toBe('agent');
    expect(
      policy.deriveEffectiveParticipation(
        profile({
          declaredParticipation: 'agent',
          moderatorParticipationOverride: 'owner',
        }),
      ),
    ).toBe('owner');
  });

  it('derives exactly one allowed public participation label from effective participation and verification', () => {
    const policy = participationPolicy();

    expect(
      policy.derivePublicParticipationLabel(
        profile({
          declaredParticipation: 'owner',
          verificationState: 'verified',
        }),
      ),
    ).toBe('verified_owner');
    expect(policy.derivePublicParticipationLabel(profile())).toBe(
      'owner_not_verified',
    );
    expect(
      policy.derivePublicParticipationLabel(
        profile({
          declaredParticipation: 'owner',
          moderatorParticipationOverride: 'agent',
          verificationState: 'verified',
        }),
      ),
    ).toBe('agent');
  });

  it('allows a risk signal to open review only, preserving declared and moderator-effective participation', () => {
    const policy = participationPolicy();
    const original = profile({
      declaredParticipation: 'owner',
      moderatorParticipationOverride: 'agent',
      reviewState: 'clear',
    });

    const afterSignal = policy.applyRiskSignal(original);

    expect(afterSignal.reviewState).toBe('under_review');
    expect(afterSignal.declaredParticipation).toBe('owner');
    expect(afterSignal.moderatorParticipationOverride).toBe('agent');
    expect(policy.deriveEffectiveParticipation(afterSignal)).toBe('agent');
  });

  it('increments the declaration version and invalidates an earlier agent confirmation when the seller changes it', () => {
    const policy = participationPolicy();
    const changed = policy.changeDeclaredParticipation(
      profile({
        declaredParticipation: 'agent',
        participationDeclarationVersion: 4,
        agentDeclarationConfirmedVersion: 4,
      }),
      'owner',
    );

    expect(changed.declaredParticipation).toBe('owner');
    expect(changed.participationDeclarationVersion).toBe(5);
    expect(changed.agentDeclarationConfirmedVersion).toBeNull();
  });

  it('allows a first agent publication only when moderator confirmation matches the exact current declaration version', () => {
    const policy = participationPolicy();

    expect(
      policy.canPublishFirstAgentListing(
        profile({
          declaredParticipation: 'agent',
          participationDeclarationVersion: 3,
          agentDeclarationConfirmedVersion: 3,
        }),
      ),
    ).toBe(true);
    expect(
      policy.canPublishFirstAgentListing(
        profile({
          declaredParticipation: 'agent',
          participationDeclarationVersion: 3,
          agentDeclarationConfirmedVersion: 2,
        }),
      ),
    ).toBe(false);
    expect(
      policy.canPublishFirstAgentListing(
        profile({
          declaredParticipation: 'agent',
          participationDeclarationVersion: 3,
          agentDeclarationConfirmedVersion: null,
        }),
      ),
    ).toBe(false);
  });
});
