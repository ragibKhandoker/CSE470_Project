const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();
const { query, pool } = require('./config/db');

async function seedNgoData() {
  try {
    console.log('Seeding NGO data (pickup points & serving logs)...');

    // Find NGO record
    const ngoRes = await query("SELECT id FROM public.ngos WHERE organization_name = 'Care Bangladesh Food Rescue' LIMIT 1");
    if (ngoRes.rows.length === 0) {
      console.log('No NGO record found. Please ensure Care Bangladesh exists.');
      return;
    }
    const ngoId = ngoRes.rows[0].id;
    console.log('Using NGO ID:', ngoId);

    // Seed Pickup Points
    const points = [
      {
        name: 'Dhanmondi Community Hub',
        address: 'House 24, Road 27 (Old 16), Dhanmondi, Dhaka',
        operating_hours: '8 AM – 9 PM',
        active_items: 5,
        status: 'Active'
      },
      {
        name: 'Banani Rescue Point',
        address: 'House 42, Road 11, Block D, Banani, Dhaka',
        operating_hours: '9 AM – 10 PM',
        active_items: 8,
        status: 'Active'
      },
      {
        name: 'Uttara Distribution Center',
        address: 'Sector 4, Rabindra Sarani, Uttara, Dhaka',
        operating_hours: '8 AM – 8 PM',
        active_items: 3,
        status: 'Active'
      }
    ];

    for (const pt of points) {
      const existing = await query('SELECT id FROM public.pickup_points WHERE name = $1', [pt.name]);
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO public.pickup_points (ngo_id, name, address, operating_hours, active_items, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ngoId, pt.name, pt.address, pt.operating_hours, pt.active_items, pt.status]
        );
        console.log(`Inserted pickup point: ${pt.name}`);
      } else {
        console.log(`Pickup point already exists: ${pt.name}`);
      }
    }

    // Seed Serving Logs
    const logs = [
      {
        donation_ref: 'SM-48210 (Veg Biryani)',
        meals_served: 45,
        location: 'Dhanmondi Hub, Dhaka',
        notes: 'Distributed fresh evening meal packs to daily wage workers.',
        served_at: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        donation_ref: 'SM-48195 (Lentil Soup & Flatbread)',
        meals_served: 60,
        location: 'Banani Rescue Point, Dhaka',
        notes: 'Served hot containers at local community center.',
        served_at: new Date(Date.now() - 48 * 3600000).toISOString()
      },
      {
        donation_ref: 'SM-48112 (Salad & Rice Boxes)',
        meals_served: 35,
        location: 'Uttara Center, Dhaka',
        notes: 'Packed lunch meals distributed to shelter families.',
        served_at: new Date(Date.now() - 72 * 3600000).toISOString()
      }
    ];

    for (const lg of logs) {
      const existing = await query('SELECT id FROM public.serving_logs WHERE donation_ref = $1', [lg.donation_ref]);
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO public.serving_logs (ngo_id, donation_ref, meals_served, location, notes, served_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ngoId, lg.donation_ref, lg.meals_served, lg.location, lg.notes, lg.served_at]
        );
        console.log(`Inserted serving log: ${lg.donation_ref}`);
      } else {
        console.log(`Serving log already exists: ${lg.donation_ref}`);
      }
    }

    console.log('✅ NGO seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding NGO data:', err);
  } finally {
    await pool.end();
  }
}

seedNgoData();
