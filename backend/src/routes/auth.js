const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const User = require('../models/User');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// POST /api/auth/register - Create organization + admin user
router.post('/register', async (req, res, next) => {
    try {
        const { orgName, orgSlug, name, email, password } = req.body;

        if (!orgName || !orgSlug || !name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check slug uniqueness
        const existingOrg = await Organization.findOne({ slug: orgSlug.toLowerCase() });
        if (existingOrg) {
            return res.status(400).json({ message: 'Organization slug already taken.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const org = await Organization.create({ name: orgName, slug: orgSlug.toLowerCase() });
        const user = await User.create({ name, email, password, role: 'ADMIN', orgId: org._id });

        const token = signToken(user._id);
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, isSuperAdmin: user.isSuperAdmin },
            organization: { id: org._id, name: org.name, slug: org.slug }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).populate('orgId');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = signToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, provider: user.provider, isSuperAdmin: user.isSuperAdmin },
            organization: { id: user.orgId._id, name: user.orgId.name, slug: user.orgId.slug }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/google-login
router.post('/google-login', async (req, res, next) => {
    try {
        const { email, name, orgName, orgSlug } = req.body;

        if (!email || !name) {
            return res.status(400).json({ message: 'Email and name are required from Google Identity.' });
        }

        let user = await User.findOne({ email: email.toLowerCase() }).populate('orgId');

        if (!user) {
            // User doesn't exist. Check if they are trying to register an org.
            if (!orgName || !orgSlug) {
                return res.status(404).json({
                    message: 'User does not exist. Please use the Register Organization page to create an account with Google first.',
                    requiresRegistration: true
                });
            }

            // Check slug uniqueness before creating
            const existingOrg = await Organization.findOne({ slug: orgSlug.toLowerCase() });
            if (existingOrg) {
                return res.status(400).json({ message: 'Organization slug already taken.' });
            }

            // Create Org and User
            const org = await Organization.create({ name: orgName, slug: orgSlug.toLowerCase() });
            user = await User.create({
                name,
                email,
                provider: 'google',
                role: 'ADMIN',
                orgId: org._id
            });

            // Populate org for the response
            user = await User.findById(user._id).populate('orgId');
        }

        const token = signToken(user._id);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, provider: user.provider, isSuperAdmin: user.isSuperAdmin },
            organization: { id: user.orgId._id, name: user.orgId.name, slug: user.orgId.slug }
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/auth/staff - Admin creates a staff user
const { protect, restrictTo } = require('../middleware/auth');
router.post('/staff', protect, restrictTo('ADMIN'), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Email already registered.' });

        const staff = await User.create({ name, email, password, role: 'STAFF', orgId: req.orgId });
        res.status(201).json({ id: staff._id, name: staff.name, email: staff.email, role: staff.role, isActive: staff.isActive, createdAt: staff.createdAt });
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/staff - Admin: list all staff in org
router.get('/staff', protect, restrictTo('ADMIN'), async (req, res, next) => {
    try {
        const staffList = await User.find({ orgId: req.orgId, role: 'STAFF' }).sort({ createdAt: -1 });
        res.json(staffList.map(s => ({ id: s._id, name: s.name, email: s.email, role: s.role, isActive: s.isActive, createdAt: s.createdAt })));
    } catch (err) {
        next(err);
    }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
    res.json({
        user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, isSuperAdmin: req.user.isSuperAdmin },
        organization: { id: req.user.orgId._id, name: req.user.orgId.name, slug: req.user.orgId.slug }
    });
});

module.exports = router;
