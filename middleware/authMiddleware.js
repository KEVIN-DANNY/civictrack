const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }
  next();
};

const requireCitizen = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }
  if (req.session.user.role !== 'citizen') {
    return res.status(403).json({ success: false, error: 'Access denied: Citizen role required.' });
  }
  next();
};

const requireAuthority = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }
  if (req.session.user.role !== 'authority') {
    return res.status(403).json({ success: false, error: 'Access denied: Authority role required.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied: Admin role required.' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireCitizen,
  requireAuthority,
  requireAdmin
};
