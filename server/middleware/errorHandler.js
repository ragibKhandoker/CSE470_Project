/**
 * Global Error Handling Middleware for Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('API Error Stack:', err.stack);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  let message = err.message || 'Internal Server Error';
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND' ||
    err.message?.includes('connect') ||
    err.message?.includes('timeout') ||
    err.message?.includes('DATABASE_URL')
  ) {
    message =
      'Database connection failed. Please ensure server/.env has the valid DATABASE_URL and that your internet network/firewall does not block Supabase port 5432 or 6543.';
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, code: err.code })
  });
};

module.exports = errorHandler;
