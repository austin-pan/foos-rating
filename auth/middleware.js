// Define public methods for specific paths
const publicRoutes = [
  { path: new RegExp('^/games/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/players/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/players/stats/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/seasons/current/?$'), methods: ['GET', 'OPTIONS'] },
  { path: new RegExp('^/timeseries/?$'), methods: ['GET', 'OPTIONS'] }
];

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
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

export { requireAuth, methodAuth };
