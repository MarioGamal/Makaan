import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchema1773549084611 implements MigrationInterface {
    name = 'CreateSchema1773549084611'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cairo_areas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name_en" character varying(120) NOT NULL, "name_ar" character varying(120) NOT NULL, "boundary" geography(Polygon,4326) NOT NULL, "parent_id" uuid, "level" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_0e65bcb40c6b9c905fe7596e780" UNIQUE ("name_en"), CONSTRAINT "UQ_6309606bb3577b973aa5a0c1d1c" UNIQUE ("name_ar"), CONSTRAINT "PK_881f8ad56f983ff8d75cd77af79" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_CAIRO_AREAS_BOUNDARY_GIST" ON "cairo_areas" USING GiST ("boundary") `);
        await queryRunner.query(`CREATE TABLE "photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "listing_id" uuid NOT NULL, "cloudinary_url" character varying(2048) NOT NULL, "display_order" integer NOT NULL DEFAULT '0', "original_filename" character varying(255) NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5220c45b8e32d49d767b9b3d725" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."listings_purpose_enum" AS ENUM('sale', 'rent')`);
        await queryRunner.query(`CREATE TYPE "public"."listings_property_type_enum" AS ENUM('Apartment', 'Villa', 'Duplex', 'Penthouse', 'Studio', 'Townhouse', 'Chalet')`);
        await queryRunner.query(`CREATE TYPE "public"."listings_finishing_level_enum" AS ENUM('Semi-finished', 'Fully finished', 'Luxury finished')`);
        await queryRunner.query(`CREATE TYPE "public"."listings_status_enum" AS ENUM('draft', 'submitted', 'active', 'rejected', 'sold', 'inactive')`);
        await queryRunner.query(`CREATE TYPE "public"."listings_rejection_reason_enum" AS ENUM('incomplete_data', 'inaccurate_location', 'duplicate', 'spam_scam')`);
        await queryRunner.query(`CREATE TABLE "listings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "area_id" uuid, "purpose" "public"."listings_purpose_enum" NOT NULL, "property_type" "public"."listings_property_type_enum" NOT NULL, "size_sqm" numeric(10,2) NOT NULL, "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "finishing_level" "public"."listings_finishing_level_enum" NOT NULL, "price_egp" numeric(12,2) NOT NULL, "location" geography(Point,4326) NOT NULL, "status" "public"."listings_status_enum" NOT NULL DEFAULT 'draft', "view_count" integer NOT NULL DEFAULT '0', "save_count" integer NOT NULL DEFAULT '0', "contact_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "submitted_at" TIMESTAMP WITH TIME ZONE, "approved_at" TIMESTAMP WITH TIME ZONE, "rejection_reason" "public"."listings_rejection_reason_enum", CONSTRAINT "PK_520ecac6c99ec90bcf5a603cdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_LISTINGS_LOCATION_GIST" ON "listings" USING GiST ("location") `);
        await queryRunner.query(`CREATE INDEX "IDX_LISTINGS_SELLER_ID" ON "listings" ("seller_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_LISTINGS_STATUS" ON "listings" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."seller_profiles_seller_type_enum" AS ENUM('owner', 'agent')`);
        await queryRunner.query(`CREATE TABLE "seller_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "seller_type" "public"."seller_profiles_seller_type_enum" NOT NULL, "listing_count" integer NOT NULL DEFAULT '0', "is_verified" boolean NOT NULL DEFAULT false, "verified_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_9b0517c80ecf6aadcb9e105c94f" UNIQUE ("user_id"), CONSTRAINT "REL_9b0517c80ecf6aadcb9e105c94" UNIQUE ("user_id"), CONSTRAINT "PK_13845670b88adfde01026410969" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_user_type_enum" AS ENUM('buyer', 'seller', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'blocked', 'deactivated')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone_number" character varying(255) NOT NULL, "user_type" "public"."users_user_type_enum" NOT NULL DEFAULT 'buyer', "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "is_phone_verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auth_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "cairo_areas" ADD CONSTRAINT "FK_9fb86852176e0216ef364337e39" FOREIGN KEY ("parent_id") REFERENCES "cairo_areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "photos" ADD CONSTRAINT "FK_9e51f248dd72d05fd97e8ecf32b" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "FK_6d2846ee6b337ce5225c8c7286b" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "FK_844247dce636c3f6950de2dc72c" FOREIGN KEY ("area_id") REFERENCES "cairo_areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seller_profiles" ADD CONSTRAINT "FK_9b0517c80ecf6aadcb9e105c94f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_50ccaa6440288a06f0ba693ccc6"`);
        await queryRunner.query(`ALTER TABLE "seller_profiles" DROP CONSTRAINT "FK_9b0517c80ecf6aadcb9e105c94f"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_844247dce636c3f6950de2dc72c"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_6d2846ee6b337ce5225c8c7286b"`);
        await queryRunner.query(`ALTER TABLE "photos" DROP CONSTRAINT "FK_9e51f248dd72d05fd97e8ecf32b"`);
        await queryRunner.query(`ALTER TABLE "cairo_areas" DROP CONSTRAINT "FK_9fb86852176e0216ef364337e39"`);
        await queryRunner.query(`DROP TABLE "auth_sessions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_user_type_enum"`);
        await queryRunner.query(`DROP TABLE "seller_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."seller_profiles_seller_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LISTINGS_STATUS"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LISTINGS_SELLER_ID"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_LISTINGS_LOCATION_GIST"`);
        await queryRunner.query(`DROP TABLE "listings"`);
        await queryRunner.query(`DROP TYPE "public"."listings_rejection_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."listings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."listings_finishing_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."listings_property_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."listings_purpose_enum"`);
        await queryRunner.query(`DROP TABLE "photos"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_CAIRO_AREAS_BOUNDARY_GIST"`);
        await queryRunner.query(`DROP TABLE "cairo_areas"`);
    }

}
