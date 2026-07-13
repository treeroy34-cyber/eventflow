/**
 * Global error handler — last middleware in Express chain.
 * Catches all errors thrown by route handlers via next(err).
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map(e => e.message);
        message = messages.join('. ');
    }

    // Mongoose duplicate key (e.g. unique email)
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const value = Object.values(err.keyValue || {})[0] || '';
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already in use.`;
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: "${err.value}"`;
    }

    // JWT errors (shouldn't normally reach here, but just in case)
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired. Please login again.';
    }

    // Log server errors
    if (statusCode >= 500) {
        console.error(`[${new Date().toISOString()}] ❌ ${req.method} ${req.path}:`, err);
    }

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
