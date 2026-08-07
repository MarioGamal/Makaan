# Post-release roadmap

This backlog is intentionally outside the first Cairo residential sale and long-term-rent release. None of
these items should delay a functional owner-first marketplace, but they must be designed before their data
or workflows are exposed publicly.

## Property marketplace hardening

- Canonical-property records that can relate multiple listings to one physical property without exposing an
  exact address.
- Duplicate detection, seller disputes, moderator adjudication, and an appeal trail.
- Verification-evidence operations: private collection, purpose-bound access, retention holds, deletion jobs,
  and audited staff access.
- Scheduled availability reconfirmation, expiry, archival, and evidence/log-retention workers.
- Production database-role separation, private media/object-storage policies, malware-scanner operations,
  map-provider restrictions, backups, recovery drills, and security monitoring.
- Representative Cairo load testing, search-index tuning, image delivery optimization, and marketplace abuse
  analytics.

## Marketplace expansion

- Additional Egyptian governorates through governed bilingual area datasets and reviewed map boundaries.
- Off-plan and developer listings with separate participation labels, project/developer verification, delivery
  milestones, payment-plan facts, and stricter advertising rules.
- Owner tools such as pricing guidance, listing-quality coaching, availability reminders, performance insights,
  and assisted but transparent buyer qualification.
- Cars or other categories only after extracting category-neutral identity, trust, moderation, saves, contact,
  media, and location capabilities. Property-specific schemas and terminology must not be reused blindly.

## Release gates for any expansion

Every expansion needs a dedicated SpecKit feature package, Arabic-first contracts and copy, protected-data
review, moderation policy, migration/rollback plan, clean-environment validation, and observable end-to-end
journeys before it can be called releasable.
