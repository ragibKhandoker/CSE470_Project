-- 017_create_stories.sql
-- Stories and home page blog posts table

CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  category VARCHAR(100) DEFAULT 'Volunteer',
  tag_color VARCHAR(50) DEFAULT '#ff6b4a',
  tag_bg VARCHAR(50) DEFAULT '#ffe4db',
  tag_icon VARCHAR(20) DEFAULT '🤝',
  read_time VARCHAR(50) DEFAULT '4 min read',
  summary TEXT,
  banner_image VARCHAR(500),
  image VARCHAR(500),
  author VARCHAR(150) DEFAULT 'ShareMeal Team',
  author_role VARCHAR(150) DEFAULT 'Community Lead',
  author_avatar VARCHAR(500),
  content TEXT,
  quote TEXT,
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed with initial stories if empty
INSERT INTO stories (title, slug, category, tag_color, tag_bg, tag_icon, read_time, summary, image, author, author_role, author_avatar, quote, display_order, is_featured)
SELECT 
  'How a Tuesday-night surplus fed 40 families',
  'tuesday-night-surplus',
  'Volunteer',
  '#d9381e',
  '#ffe4db',
  '🤝',
  '4 min read',
  'A local restaurant''s unsold dinner prep became 40 packed meals — and the story of the volunteers who made it happen in under two hours.',
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
  'Nusrat Jahan',
  'Community Lead',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  'It''s easy to assume surplus is just scraps. In reality, this was a five-star meal for families who hadn''t eaten since morning.',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM stories WHERE slug = 'tuesday-night-surplus');

INSERT INTO stories (title, slug, category, tag_color, tag_bg, tag_icon, read_time, summary, image, author, author_role, author_avatar, quote, display_order, is_featured)
SELECT 
  'Robin Hood Army on scaling neighbourhood kitchens',
  'robin-hood-army-kitchens',
  'NGO',
  '#1d4ed8',
  '#eff6ff',
  '🏢',
  '6 min read',
  'How community-led decentralized hubs are distributing over 1,500 meals every weekend across Banani and Mohakhali.',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'Tanvir Ahmed',
  'Operations Manager',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  'When you build a network of trust, restaurants call you before food even leaves the stove.',
  2,
  false
WHERE NOT EXISTS (SELECT 1 FROM stories WHERE slug = 'robin-hood-army-kitchens');

INSERT INTO stories (title, slug, category, tag_color, tag_bg, tag_icon, read_time, summary, image, author, author_role, author_avatar, quote, display_order, is_featured)
SELECT 
  'The quiet logistics of rescuing fresh produce',
  'logistics-rescuing-fresh-produce',
  'Impact',
  '#15803d',
  '#dcfce7',
  '🌱',
  '5 min read',
  'Cold-chain transport, quick sorting, and reaching beneficiaries within 3 hours of harvest surplus in Karwan Bazar.',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80',
  'Dev Malhotra',
  'Field Logistics Lead',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  'Every kilogram of vegetables saved reduces carbon emissions and feeds vulnerable neighbours.',
  3,
  false
WHERE NOT EXISTS (SELECT 1 FROM stories WHERE slug = 'logistics-rescuing-fresh-produce');

INSERT INTO stories (title, slug, category, tag_color, tag_bg, tag_icon, read_time, summary, image, author, author_role, author_avatar, quote, display_order, is_featured)
SELECT 
  'I volunteered for one week — here''s what I saw',
  'i-volunteered-for-one-week',
  'Volunteer',
  '#6b46c1',
  '#f0e9fb',
  '🤝',
  '7 min read',
  'A first-person account from a college student who signed up for ShareMeal''s volunteer programme and ended up staying for six months.',
  'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80',
  'Dev Malhotra',
  'ShareMeal contributor',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  'That was it. No ceremony, no speech. Just food, and a person who needed it, and me in the middle.',
  4,
  false
WHERE NOT EXISTS (SELECT 1 FROM stories WHERE slug = 'i-volunteered-for-one-week');
