// Fallback error handler
const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  // Handle JSON parsing errors specifically
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorMiddleware;
