INSERT INTO users (id, phone_number, user_type, status, is_phone_verified, created_at)
VALUES
  ('a1000000-0000-0000-0000-000000000001', '+201012345678', 'seller', 'active', true, now()),
  ('a1000000-0000-0000-0000-000000000002', '+201098765432', 'seller', 'active', true, now());

INSERT INTO seller_profiles (id, user_id, seller_type, listing_count, is_verified)
VALUES
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'owner', 3, true),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'agent', 12, false);

INSERT INTO listings (id, seller_id, purpose, property_type, size_sqm, bedrooms, bathrooms, finishing_level, price_egp, location, status, approved_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'sale', 'Apartment', 120, 3, 2, 'Fully finished', 2500000, ST_SetSRID(ST_MakePoint(31.3366, 30.0682), 4326), 'active', now(), now(), now()),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'rent', 'Apartment', 85, 2, 1, 'Semi-finished', 18000, ST_SetSRID(ST_MakePoint(31.2272, 30.0626), 4326), 'active', now(), now(), now()),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'sale', 'Villa', 350, 5, 4, 'Luxury finished', 15000000, ST_SetSRID(ST_MakePoint(31.4913, 30.0074), 4326), 'active', now(), now(), now()),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'sale', 'Duplex', 200, 4, 3, 'Fully finished', 4800000, ST_SetSRID(ST_MakePoint(31.2461, 29.9765), 4326), 'active', now(), now(), now()),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000001', 'rent', 'Studio', 45, 1, 1, 'Fully finished', 8500, ST_SetSRID(ST_MakePoint(31.2156, 30.0594), 4326), 'active', now(), now(), now()),
  (gen_random_uuid(), 'a1000000-0000-0000-0000-000000000002', 'sale', 'Penthouse', 180, 3, 2, 'Luxury finished', 7200000, ST_SetSRID(ST_MakePoint(31.2243, 30.0509), 4326), 'active', now(), now(), now());
