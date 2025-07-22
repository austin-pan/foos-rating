import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

// Define public methods for specific paths
const publicRoutes = [
  { path: new RegExp('^/games/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/players/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/players/stats/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/seasons/current/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/timeseries/?$'), methods: ['GET', 'OPTIONS'] }
];

const jwtAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed token' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(err);
    }

    req.user = user; // Attach user info from JWT to the request
    next();
  });
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  jwtAuth(req, res, () => {
    if (req.user) {
      return next();
    }
    res.status(401).json({ error: 'Authentication required' });
  });
};

// Method-based authentication middleware
const methodAuth = (req, res, next) => {
  const isPublicRoute = publicRoutes.some(route =>
    route.path.test(req.path) && route.methods.includes(req.method)
  );
  if (isPublicRoute) {
    return next();
  }

  return requireAuth(req, res, next);
};

export { jwtAuth, requireAuth, methodAuth };
