const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const { query, pool } = require('./config/db');

/**
 * Seed food posts directly into PostgreSQL food_posts table
 * strictly matching Figma Node 8:23608 & 8:26244.
 */
async function seedDonations() {
  try {
    // Find an existing donor (prefer abdur@test.com or first donor)
    let donorRes = await query("SELECT id, name, email FROM public.users WHERE role = 'donor' ORDER BY id ASC LIMIT 1");
    if (donorRes.rows.length === 0) {
      console.log('No donor found in database. Creating test donor...');
      const bcrypt = require('bcryptjs');
      const passHash = await bcrypt.hash('Password123!', 10);
      donorRes = await query(
        `INSERT INTO public.users (name, phone, email, password_hash, role, verification_status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email`,
        ['Abdur Rahman', '01811111111', 'abdur@test.com', passHash, 'donor', 'verified']
      );
    }
    const donorId = donorRes.rows[0].id;
    console.log(`Using donor ID ${donorId} (${donorRes.rows[0].name}, ${donorRes.rows[0].email}) for seeding...`);

    const samplePosts = [
      {
        food_type: 'Veg',
        quantity: 12,
        expiry_time: new Date(Date.now() + 95 * 60000).toISOString(),
        status: 'collected',
        district: 'Dhaka',
        thana: 'Banani',
        area_ward: 'Road 11',
        house_no: 'House 42',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        notes: 'Freshly prepped farm salads with olive oil dressings packed separately.'
      },
      {
        food_type: 'Cooked',
        quantity: 25,
        expiry_time: new Date(Date.now() + 40 * 60000).toISOString(),
        status: 'available',
        district: 'Dhaka',
        thana: 'Uttara',
        area_ward: 'Sector 4',
        house_no: 'Platter Kitchen',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        notes: 'Hot rice platters with lentils and mixed vegetables cooked this evening.'
      },
      {
        food_type: 'Veg',
        quantity: 8,
        expiry_time: new Date(Date.now() + 180 * 60000).toISOString(),
        status: 'at_ngo_point',
        district: 'Dhaka',
        thana: 'Dhanmondi',
        area_ward: 'Road 27',
        house_no: 'Green Bowl Hub',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        notes: 'Nutrient-rich quinoa & brown rice bowls with steamed edamame.'
      },
      {
        food_type: 'Produce',
        quantity: 30,
        expiry_time: new Date(Date.now() - 3600000).toISOString(),
        status: 'taken',
        district: 'Dhaka',
        thana: 'Gulshan',
        area_ward: 'Gulshan 2',
        house_no: 'Crate Mart',
        image_url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
        notes: 'Clean whole carrots, sweet potatoes, and organic zucchini in ventilated crates.'
      },
      {
        food_type: 'Baked',
        quantity: 4,
        expiry_time: new Date(Date.now() - 86400000).toISOString(),
        status: 'expired',
        district: 'Dhaka',
        thana: 'Mirpur',
        area_ward: 'Mirpur DOHS',
        house_no: 'Artisan Bakery',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        notes: 'Freshly baked artisanal flatbreads and savory focaccia.'
      }
    ];

    for (const post of samplePosts) {
      await query(
        `INSERT INTO public.food_posts 
         (donor_id, food_type, quantity, expiry_time, status, district, thana, area_ward, house_no, image_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          donorId,
          post.food_type,
          post.quantity,
          post.expiry_time,
          post.status,
          post.district,
          post.thana,
          post.area_ward,
          post.house_no,
          post.image_url,
          post.notes
        ]
      );
    }

    console.log(`✅ Successfully inserted ${samplePosts.length} Figma food posts into PostgreSQL for donor ${donorId}.`);
  } catch (err) {
    console.error('Seed Donations Error:', err);
  } finally {
    await pool.end();
  }
}

seedDonations();
