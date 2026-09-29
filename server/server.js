const path = require('path');
const fs = require('fs');
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

const server = app.listen(PORT, () => {
  console.log('\n======================================================');
  console.log(' 🍲 ShareMeal Unified App is running!');
  console.log(` ➜  Local URL:   http://localhost:${PORT}`);
  console.log(` ➜  API Status:  http://localhost:${PORT}/api/health`);
  console.log(`    Frontend & Backend are BOTH on Port ${PORT}`);
  console.log('======================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  PORT ${PORT} IS ALREADY IN USE!`);
    console.error(`An existing server is already running on http://localhost:${PORT}`);
    console.error(`To free port ${PORT}, run:`);
    console.error(`  npx kill-port ${PORT}\n`);
    process.exit(1);
  } else {
    console.error('Server listen error:', err.message);
    process.exit(1);
  }
});
