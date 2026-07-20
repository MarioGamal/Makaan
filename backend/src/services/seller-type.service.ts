import { SellerType } from '@makaan/shared/constants/enums';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Listing } from '../models/listing.entity';
import { SellerProfile } from '../models/seller-profile.entity';
import { User } from '../models/user.entity';

@Injectable()
export class SellerTypeInferenceService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SellerProfile)
    private readonly sellerProfileRepository: Repository<SellerProfile>,
  ) {}

  async inferSellerType(userId: string): Promise<SellerType> {
    const listingCount = await this.listingRepository.count({
      where: { sellerId: userId },
    });
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const weeklyFrequency = await this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.seller_id = :userId', { userId })
      .andWhere('listing.created_at >= :lastWeek', { lastWeek })
      .getCount();

    const uniquePhones = user?.phoneNumber ? 1 : 0;

    const inferredType =
      listingCount <= 5 && uniquePhones <= 1 && weeklyFrequency < 3
        ? SellerType.OWNER
        : SellerType.AGENT;

    let profile = await this.sellerProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      profile = this.sellerProfileRepository.create({
        userId,
        sellerType: inferredType,
        listingCount,
        isVerified: false,
        verifiedAt: null,
      });
    } else {
      profile.sellerType = inferredType;
      profile.listingCount = listingCount;
    }

    await this.sellerProfileRepository.save(profile);

    return inferredType;
  }
}

