/**
 * Global Express error handling middleware.
 */
module.exports = (err, req, res, next) => {
  console.error('Unhandled server error:', err);
  
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
