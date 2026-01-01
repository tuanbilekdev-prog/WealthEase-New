import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    const tokenFromQuery = req.query.token;
    const token = tokenFromHeader || tokenFromQuery;

    if (!token) {
      console.log('❌ No token provided in request');
      console.log('   Authorization header:', authHeader ? 'Present' : 'Missing');
      console.log('   Query token:', tokenFromQuery ? 'Present' : 'Missing');
      return res.status(401).json({ 
        error: 'User not authenticated',
        details: 'No authentication token provided. Please log in again.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Attach user info to request
    req.user = decoded;
    console.log(`✅ Token verified for user: ${decoded.email || decoded.userId}`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Invalid token:', error.message);
      return res.status(401).json({ 
        error: 'User not authenticated',
        details: 'Invalid authentication token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      console.log('❌ Token expired:', error.message);
      return res.status(401).json({ 
        error: 'User not authenticated',
        details: 'Your session has expired. Please log in again.'
      });
    }
    console.error('❌ Token verification error:', error);
    return res.status(500).json({ 
      error: 'User not authenticated',
      details: 'Token verification failed. Please try again.'
    });
  }
};

