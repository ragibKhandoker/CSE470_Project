const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

// Auto-build client if dist is missing
const clientDistIndex = path.join(__dirname, '../client/dist/index.html');
if (!fs.existsSync(clientDistIndex)) {
  console.log('📦 Client build not found. Automatically building frontend bundle for Unified Port Mode...');
  try {
    execSync('npm run build', { cwd: path.join(__dirname, '../client'), stdio: 'inherit' });
    console.log('✅ Client build completed successfully!');
  } catch (err) {
    console.warn('⚠️ Client auto-build failed:', err.message);
  }
}

const app = require('./app');

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, async () => {
  console.log('\n======================================================');
  console.log(' 🍲 ShareMeal Unified App is running!');
  console.log(` ➜  Local URL:   http://localhost:${PORT}`);
  console.log(` ➜  API Status:  http://localhost:${PORT}/api/health`);
  console.log(`    Frontend & Backend are BOTH on Port ${PORT}`);
  console.log('======================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const healthCheck = http.get(`http://127.0.0.1:${PORT}/api/health`, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          const health = JSON.parse(body);
          if (response.statusCode === 200 && health.status === 'OK') {
            console.log(`ShareMeal backend is already running at http://localhost:${PORT}; reusing it.`);
            process.exit(0);
          }
        } catch (parseError) {
          console.error('Could not verify the service using this port:', parseError.message);
        }
        console.error(`PORT ${PORT} is occupied by a service that is not the ShareMeal API.`);
        process.exit(1);
      });
    });
    healthCheck.setTimeout(2000, () => {
      healthCheck.destroy(new Error('Health check timed out'));
    });
    healthCheck.on('error', (healthError) => {
      console.error(`PORT ${PORT} is already in use and ShareMeal could not verify the existing service: ${healthError.message}`);
      process.exit(1);
    });
  } else {
    console.error('Server listen error:', err.message);
    process.exit(1);
  }
});

const pool = require('./config/db');
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Supabase Database Connected!');
  } catch (err) {
    console.log('❌ Supabase Database Connection Failed:', err.message);
  }
}

checkDatabaseConnection();
