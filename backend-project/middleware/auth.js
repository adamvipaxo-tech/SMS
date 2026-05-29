const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'stockhub_sms_secret');
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
