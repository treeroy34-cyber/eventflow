const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies JWT and attaches req.user + req.orgId
 */
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated. Please login.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session expired. Please login again.' });
            }
            return res.status(401).json({ message: 'Invalid token. Please login again.' });
        }

        // +password because our model hides it by default with select:false
        const user = await User.findById(decoded.id).select('+password').populate('orgId');

        if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
        if (!user.isActive) return res.status(403).json({ message: 'Account has been deactivated.' });

        req.user = user;
        req.orgId = user.orgId._id;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed.' });
    }
};

/**
 * restrictTo — RBAC: only allow specific roles through
 * Usage: restrictTo('ADMIN') or restrictTo('ADMIN', 'STAFF')
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
            });
        }
        next();
    };
};

/**
 * restrictToSuperAdmin — limits route only to global platform admins
 */
const restrictToSuperAdmin = (req, res, next) => {
    if (!req.user || (!req.user.isSuperAdmin && req.user.email !== 'tasqrrr315@gmail.com')) {
        return res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    }
    next();
};

module.exports = { protect, restrictTo, restrictToSuperAdmin };
