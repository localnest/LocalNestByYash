-- ============================================================================
-- HYPERLOCAL SERVICES & RECURRING MARKETPLACE - SEED DATA (SUPABASE / POSTGRESQL)
-- Initial Pilot: Greenfield Heights (1,790 flats) + expansion societies
-- Realistic providers, dynamic pricing models, subscriptions, and transactions.
-- ============================================================================

-- 1. Communities & Societies
INSERT INTO communities (id, name, area, city, state, pincode) VALUES
('c1111111-1111-1111-1111-111111111111', 'Whitefield Cluster', 'ITPL Main Road', 'Bengaluru', 'Karnataka', '560066'),
('c2222222-2222-2222-2222-222222222222', 'Sarjapur Corridor', 'Sarjapur Road', 'Bengaluru', 'Karnataka', '560035');

INSERT INTO societies (id, community_id, name, address_line, city, pincode, total_flats, is_active) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Greenfield Heights', 'Channasandra Main Rd, Whitefield', 'Bengaluru', '560066', 1790, TRUE),
('s2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Silver Oak Palms', 'Varthur Kodi, Whitefield', 'Bengaluru', '560066', 950, TRUE),
('s3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'Royal Palms Residency', 'Kaikondrahalli, Sarjapur Rd', 'Bengaluru', '560035', 2100, TRUE);

-- 2. Categories
INSERT INTO categories (id, name, slug, icon, description, sort_order) VALUES
('cat11111-1111-1111-1111-111111111111', 'Laundry & Dry Clean', 'laundry', 'Shirt', 'Wash, fold, premium steam ironing and dry cleaning', 1),
('cat22222-2222-2222-2222-222222222222', 'Daily Tiffin & Meals', 'tiffin', 'UtensilsCrossed', 'Nutritious home-cooked daily lunch and dinner boxes', 2),
('cat33333-3333-3333-3333-333333333333', 'Deep Home Cleaning', 'cleaning', 'Sparkles', 'Kitchen, bathroom, sofa and complete flat deep cleaning', 3),
('cat44444-4444-4444-4444-444444444444', 'Doorstep Car Wash', 'car-wash', 'Car', 'Eco-friendly waterless exterior & interior shine at your parking slot', 4),
('cat55555-5555-5555-5555-555555555555', 'Electrician', 'electrician', 'Zap', 'Wiring, switches, fan installations and fuse fixes', 5),
('cat66666-6666-6666-6666-666666666666', 'AC Service & Repair', 'ac-service', 'Snowflake', 'Filter wash, jet cleaning, gas recharge, and inspection', 6);

-- 3. Profiles (Customer, Provider, Admin)
INSERT INTO profiles (id, email, full_name, phone, role, society_id, flat_number) VALUES
('u1111111-1111-1111-1111-111111111111', 'rahul.sharma@example.com', 'Rahul Sharma', '+91 98765 43210', 'CUSTOMER', 's1111111-1111-1111-1111-111111111111', 'Tower A - 402'),
('u2222222-2222-2222-2222-222222222222', 'raj.laundry@example.com', 'Rajesh Kumar', '+91 98111 22334', 'PROVIDER', 's1111111-1111-1111-1111-111111111111', 'Shop 4, Commercial Complex'),
('u3333333-3333-3333-3333-333333333333', 'freshbite.tiffin@example.com', 'Sunita Patil', '+91 98222 33445', 'PROVIDER', 's1111111-1111-1111-1111-111111111111', 'Tower C - 104'),
('u4444444-4444-4444-4444-444444444444', 'admin@hyperlocal.app', 'Platform Admin', '+91 99999 00000', 'ADMIN', 's1111111-1111-1111-1111-111111111111', 'HQ Unit 1');

-- 4. Commission Rules (Configurable Take Rate)
INSERT INTO commission_rules (id, rule_type, commission_percentage, notes) VALUES
('cr111111-1111-1111-1111-111111111111', 'DEFAULT', 10.00, 'Default platform take rate across all services'),
('cr222222-2222-2222-2222-222222222222', 'CATEGORY', 12.00, 'Laundry category commission'),
('cr333333-3333-3333-3333-333333333333', 'CATEGORY', 8.00, 'AC Repair category promotional commission');

-- 5. Providers
INSERT INTO providers (id, user_id, business_name, category_id, description, status, verified_at, rating, review_count, completed_orders, on_time_rate) VALUES
('p1111111-1111-1111-1111-111111111111', 'u2222222-2222-2222-2222-222222222222', 'Raj Laundry & Dry Cleaners', 'cat11111-1111-1111-1111-111111111111', 'Serving Greenfield Heights for 3+ years. Free pickup & doorstep delivery within 24 hours. Gentle wash & crisp steam pressing.', 'VERIFIED', NOW() - INTERVAL '60 days', 4.85, 342, 1240, 98.40),
('p2222222-2222-2222-2222-222222222222', 'u3333333-3333-3333-3333-333333333333', 'FreshBite Tiffin & Home Meals', 'cat22222-2222-2222-2222-222222222222', 'Homestyle vegetarian and North/South Indian meals prepared fresh with cold-pressed oils and organic pulses. Hot insulated lunch & dinner boxes.', 'VERIFIED', NOW() - INTERVAL '90 days', 4.90, 218, 890, 99.10),
('p3333333-3333-3333-3333-333333333333', NULL, 'SparkleHome Deep Cleaning', 'cat33333-3333-3333-3333-333333333333', 'Trained & verified cleaners using hospital-grade disinfectants and German machinery for bathroom, kitchen & sofa care.', 'VERIFIED', NOW() - INTERVAL '30 days', 4.75, 95, 410, 96.50),
('p4444444-4444-4444-4444-444444444444', NULL, 'ProFix Electricals & Handyman', 'cat55555-5555-5555-5555-555555555555', 'Licensed electricians residing right inside the locality. 15-minute emergency response for power cuts, tripping and installations.', 'VERIFIED', NOW() - INTERVAL '45 days', 4.80, 160, 620, 97.80),
('p5555555-5555-5555-5555-555555555555', NULL, 'CoolBreeze AC Care', 'cat66666-6666-6666-6666-666666666666', 'Certified inverter & split AC technicians. Transparent pricing: ₹299 inspection fee adjusted if full repair or service is booked.', 'VERIFIED', NOW() - INTERVAL '15 days', 4.70, 78, 280, 95.20),
('p6666666-6666-6666-6666-666666666666', NULL, 'AutoGleam Doorstep Car Wash', 'cat44444-4444-4444-4444-444444444444', 'Daily/alternate day waterless car cleaning directly at your basement parking slot before 7:30 AM.', 'VERIFIED', NOW() - INTERVAL '20 days', 4.92, 184, 760, 99.50),
('p7777777-7777-7777-7777-777777777777', NULL, 'Modern Woodcraft & Carpenters', NULL, 'Custom woodwork, door locks, furniture repairs. Free estimate visits.', 'PENDING', NULL, 0.00, 0, 0, 100.00);

-- Link Providers to Greenfield Heights Society
INSERT INTO provider_service_areas (provider_id, society_id) VALUES
('p1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111'),
('p2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111'),
('p3333333-3333-3333-3333-333333333333', 's1111111-1111-1111-1111-111111111111'),
('p4444444-4444-4444-4444-444444444444', 's1111111-1111-1111-1111-111111111111'),
('p5555555-5555-5555-5555-555555555555', 's1111111-1111-1111-1111-111111111111'),
('p6666666-6666-6666-6666-666666666666', 's1111111-1111-1111-1111-111111111111');

-- 6. Services & Dynamic Pricing Models
-- Pricing Model 1: PER_ITEM (Laundry)
INSERT INTO services (id, provider_id, category_id, name, description, pricing_model, base_price, unit_name, is_subscription_supported) VALUES
('srv11111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'Wash & Fold / Steam Iron', 'Standard clothes washing, tumble drying, and wrinkle-free steam ironing with eco-friendly detergent.', 'PER_ITEM', 40.00, 'per item', TRUE);

-- Pricing Model 2: SUBSCRIPTION (Tiffin)
INSERT INTO services (id, provider_id, category_id, name, description, pricing_model, base_price, unit_name, is_subscription_supported) VALUES
('srv22222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'cat22222-2222-2222-2222-222222222222', 'Monthly Deluxe Lunch Subscription', '4 Phulkas/Rotis, Seasonal Dal, Special Sabzi, Rice, Salad and Sweet. Mon to Sat delivery right to your door.', 'SUBSCRIPTION', 3000.00, 'per month', TRUE);

-- Pricing Model 3: FIXED (Deep Cleaning)
INSERT INTO services (id, provider_id, category_id, name, description, pricing_model, base_price, unit_name, is_subscription_supported) VALUES
('srv33333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'cat33333-3333-3333-3333-333333333333', 'Complete Bathroom Deep Cleaning', 'Tile scrubbing, hard water stain removal, sanitary disinfection, tap and glass descaling.', 'FIXED', 499.00, 'per bathroom', FALSE);

-- Pricing Model 4: HOURLY (Electrician)
INSERT INTO services (id, provider_id, category_id, name, description, pricing_model, base_price, unit_name, is_subscription_supported) VALUES
('srv44444-4444-4444-4444-444444444444', 'p4444444-4444-4444-4444-444444444444', 'cat55555-5555-5555-5555-555555555555', 'General Electrician Inspection & Fix', 'Switches, wiring faults, MCB tripping and appliance hookup. First hour ₹300, additional hours ₹150.', 'HOURLY', 300.00, 'per hour', FALSE);

-- Pricing Model 5: INSPECTION_VARIABLE (AC Repair)
INSERT INTO services (id, provider_id, category_id, name, description, pricing_model, base_price, unit_name, is_subscription_supported) VALUES
('srv55555-5555-5555-5555-555555555555', 'p5555555-5555-5555-5555-555555555555', 'cat66666-6666-6666-6666-666666666666', 'AC Diagnosis & Foam Jet Servicing', '₹299 inspection & leak check. Spare parts and refrigerant gas charged as per standardized rate card.', 'INSPECTION_VARIABLE', 299.00, 'inspection fee', FALSE);

-- Pricing Model 6: SUBSCRIPTION (Doorstep Car Wash)
INSERT INTO services (id, provider_id, category_id, name, description, pricing_model, base_price, unit_name, is_subscription_supported) VALUES
('srv66666-6666-6666-6666-666666666666', 'p6666666-6666-6666-6666-666666666666', 'cat44444-4444-4444-4444-444444444444', 'Daily Basement Parking Car Wash', 'Daily microfiber exterior dusting, alternate-day waterless wax wipe, and bi-weekly tire shine.', 'SUBSCRIPTION', 500.00, 'per month', TRUE);

-- 7. Coupons & Promotions
INSERT INTO coupons (id, code, title, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, per_user_limit, current_usage, is_active) VALUES
('cpn11111-1111-1111-1111-111111111111', 'WELCOME100', 'Flat ₹100 Off', 'Welcome offer for new residents of Greenfield Heights', 'FLAT', 100.00, 400.00, 100.00, 500, 1, 48, TRUE),
('cpn22222-2222-2222-2222-222222222222', 'LAUNDRY10', '10% Off Laundry', '10% instant discount on laundry and dry clean orders', 'PERCENTAGE', 10.00, 300.00, 150.00, 1000, 3, 112, TRUE),
('cpn33333-3333-3333-3333-333333333333', 'TIFFIN20', '20% Off 1st Month Tiffin', 'Get 20% discount on your first month daily tiffin plan', 'SUBSCRIPTION', 20.00, 2500.00, 600.00, 100, 1, 24, TRUE),
('cpn44444-4444-4444-4444-444444444444', 'FIRST50', '₹50 Off First Booking', 'Flat ₹50 off on any service booking', 'FIRST_ORDER', 50.00, 200.00, 50.00, 2000, 1, 88, TRUE);

-- 8. Orders & Status Machine (Representative live records)
INSERT INTO orders (
  id, order_number, customer_id, provider_id, service_id, society_id, status,
  scheduled_date, scheduled_slot, delivery_address, special_instructions,
  pricing_model, item_quantity, subtotal, platform_fee, discount_amount, total_amount,
  commission_percentage, platform_commission, provider_earnings
) VALUES
(
  'ord11111-1111-1111-1111-111111111111', 'ORD-2026-1011',
  'u1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'srv11111-1111-1111-1111-111111111111',
  's1111111-1111-1111-1111-111111111111', 'SCHEDULED',
  CURRENT_DATE + INTERVAL '1 day', '10:00 AM - 12:00 PM', 'Tower A - 402, Greenfield Heights',
  'Please ring bell twice. Cotton shirts need crisp hanger press.',
  'PER_ITEM', 12, 480.00, 20.00, 50.00, 450.00,
  10.00, 48.00, 432.00
),
(
  'ord22222-2222-2222-2222-222222222222', 'ORD-2026-0988',
  'u1111111-1111-1111-1111-111111111111', 'p3333333-3333-3333-3333-333333333333', 'srv33333-3333-3333-3333-333333333333',
  's1111111-1111-1111-1111-111111111111', 'COMPLETED',
  CURRENT_DATE - INTERVAL '3 days', '02:00 PM - 04:00 PM', 'Tower A - 402, Greenfield Heights',
  'Master bathroom hard water stains on tiles.',
  'FIXED', 1, 499.00, 20.00, 0.00, 519.00,
  10.00, 49.90, 449.10
);

-- 9. Subscriptions
INSERT INTO subscriptions (
  id, customer_id, provider_id, service_id, society_id, status,
  frequency, scheduled_time_slot, start_date, next_service_date, renewal_date, monthly_price
) VALUES
(
  'sub11111-1111-1111-1111-111111111111',
  'u1111111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222', 'srv22222-2222-2222-2222-222222222222',
  's1111111-1111-1111-1111-111111111111', 'ACTIVE',
  'MON_TO_SAT', '12:30 PM - 01:30 PM',
  CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '15 days',
  3000.00
);

-- 10. Reviews for Completed Orders
INSERT INTO reviews (id, order_id, customer_id, provider_id, rating, comment, is_verified_purchase) VALUES
('rev11111-1111-1111-1111-111111111111', 'ord22222-2222-2222-2222-222222222222', 'u1111111-1111-1111-1111-111111111111', 'p3333333-3333-3333-3333-333333333333', 5, 'Spotless clean! Master bathroom looks brand new. The team was courteous, wore shoe covers and completed exactly on time.', TRUE);
