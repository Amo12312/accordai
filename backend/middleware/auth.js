const jwt = require('jsonwebtoken');
const MemoryUser = require('../models/MemoryUser');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 Token decoded:', decoded);

    // Get user from the decoded token using MemoryUser (in-memory storage)
    const user = MemoryUser.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ User not found for token:', decoded.userId);
      return res.status(401).json({ error: 'Token is not valid' });
    }

    console.log('✅ Auth middleware: User authenticated:', user.email);
    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
