import { resolve } from 'path';

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import { AuthSession } from '../models/auth-session.entity';
import { CairoArea } from '../models/cairo-area.entity';
import { Listing } from '../models/listing.entity';
import { Photo } from '../models/photo.entity';
import { SellerProfile } from '../models/seller-profile.entity';
import { User } from '../models/user.entity';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, CairoArea, Listing, Photo, AuthSession, SellerProfile],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
