import { createDecipheriv, createHash } from 'node:crypto';

import {
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PublicListingService } from './public-listing.service';
import { hashProtectedToken, newOpaqueToken } from './session.service';

type ContactMethod = 'phone' | 'whatsapp';
type SellerContactRow = {
  phone_ciphertext: string | null;
  legacy_phone_number: string | null;
};
type IntentRow = {
  id: string;
  listing_id: string;
  anonymous_subject_id: string;
  method: ContactMethod;
  expires_at: Date;
  resolved_at: Date | null;
};

@Injectable()
export class ContactIntentService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly publicListings: PublicListingService,
  ) {}

  async create(
    listingId: string,
    anonymousSubjectId: string,
    method: ContactMethod,
    correlationId: string,
  ): Promise<{ token: string; expiresAt: string }> {
    await this.publicListings.detail(listingId, 'ar');
    await this.contactDestination(listingId);
    const token = newOpaqueToken();
    const acceptedAt = new Date();
    const expiresAt = new Date(
      acceptedAt.getTime() +
        this.config.getOrThrow<number>('CONTACT_INTENT_TTL_SECONDS') * 1000,
    );
    await this.dataSource.query(
      `INSERT INTO contact_intents
        (listing_id, user_id, anonymous_subject_id, method, rate_decision,
         resolver_token_hash, accepted_at, expires_at, correlation_id, created_at)
       VALUES ($1, NULL, $2, $3, 'accepted', $4, $5, $6, $7, $5)`,
      [
        listingId,
        anonymousSubjectId,
        method,
        this.hashToken(token),
        acceptedAt,
        expiresAt,
        correlationId,
      ],
    );
    return { token, expiresAt: expiresAt.toISOString() };
  }

  async resolve(
    token: string,
    anonymousSubjectId: string,
    correlationId: string,
  ): Promise<string> {
    const intent = await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<IntentRow[]>(
        `SELECT id, listing_id, anonymous_subject_id, method, expires_at, resolved_at
           FROM contact_intents
          WHERE resolver_token_hash = $1 AND rate_decision = 'accepted'
          FOR UPDATE`,
        [this.hashToken(token)],
      );
      const match = rows[0];
      if (!match || match.anonymous_subject_id !== anonymousSubjectId) {
        throw new UnauthorizedException('contact_intent_invalid');
      }
      if (
        match.resolved_at ||
        new Date(match.expires_at).getTime() <= Date.now()
      ) {
        throw new GoneException('contact_intent_expired_or_used');
      }
      const resolvedAt = new Date();
      await manager.query(
        `UPDATE contact_intents SET resolved_at = $2 WHERE id = $1`,
        [match.id, resolvedAt],
      );
      await manager.query(
        `INSERT INTO contact_events
          (intent_id, listing_id, user_id, anonymous_subject_id, method, correlation_id, occurred_at)
         VALUES ($1, $2, NULL, $3, $4, $5, $6)`,
        [
          match.id,
          match.listing_id,
          anonymousSubjectId,
          match.method,
          correlationId,
          resolvedAt,
        ],
      );
      await manager.query(
        `UPDATE listings SET contact_count = contact_count + 1 WHERE id = $1`,
        [match.listing_id],
      );
      return match;
    });

    const phone = await this.contactDestination(intent.listing_id);
    if (intent.method === 'whatsapp') {
      const text = encodeURIComponent(
        `أهلاً، أنا مهتم بالعقار المعروض على مكان (${intent.listing_id}).`,
      );
      return `https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`;
    }
    return `tel:${phone}`;
  }

  private async contactDestination(listingId: string): Promise<string> {
    const rows = await this.dataSource.query<SellerContactRow[]>(
      `SELECT seller.phone_ciphertext, seller.legacy_phone_number
         FROM listings listing
         JOIN users seller ON seller.id = listing.seller_id
        WHERE listing.id = $1`,
      [listingId],
    );
    const contact = rows[0];
    const phone = contact?.phone_ciphertext
      ? this.decrypt(contact.phone_ciphertext)
      : contact?.legacy_phone_number;
    if (!phone || !/^\+201[0125]\d{8}$/.test(phone)) {
      throw new NotFoundException('Listing contact is unavailable');
    }
    return phone;
  }

  private hashToken(token: string): string {
    return hashProtectedToken(
      token,
      this.config.getOrThrow<string>('SESSION_TOKEN_PEPPER'),
    );
  }

  private decrypt(value: string): string {
    const [version, ivValue, tagValue, ciphertextValue] = value.split(':');
    if (version !== 'v1' || !ivValue || !tagValue || !ciphertextValue) {
      throw new NotFoundException('Listing contact is unavailable');
    }
    try {
      const key = createHash('sha256')
        .update(this.config.getOrThrow<string>('FIELD_ENCRYPTION_KEY'))
        .digest();
      const decipher = createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(ivValue, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextValue, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new NotFoundException('Listing contact is unavailable');
    }
  }
}
