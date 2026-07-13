const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_eventflow');
const { nanoid } = require('nanoid');
const emailService = require('../services/emailService');
const qrService = require('../services/qrService');

// POST /api/payment/create-checkout-session
// Public endpoint for users to pay for an event
router.post('/create-checkout-session', async (req, res, next) => {
    try {
        const { eventId, name, email, phone, organization } = req.body;

        if (!eventId || !name || !email) {
            return res.status(400).json({ message: 'Event ID, Name, and Email are required.' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found.' });

        // Ensure the event is paid
        if (!event.isPaid || !event.price || event.price <= 0) {
            return res.status(400).json({ message: 'This event is free. Please proceed with standard registration.' });
        }

        // Check capacity
        const count = await Registration.countDocuments({ eventId: event._id, status: 'REGISTERED' });
        if (count >= event.capacity) {
            return res.status(400).json({ message: 'Event is fully booked!' });
        }

        // Check if user is already registered for this exact event
        const existing = await Registration.findOne({ email: email.toLowerCase(), eventId: event._id, status: 'REGISTERED' });
        if (existing) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        // Stripe requires amount in smallest currency unit (paise for INR)
        const unitAmount = Math.round(event.price * 100);

        const origin = req.get('origin') || process.env.CLIENT_URL || 'http://localhost:3000';

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Ticket for ${event.title}`,
                            description: `Date: ${new Date(event.date).toLocaleDateString()}`,
                            images: event.image ? [event.image] : [],
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/cancel`,
            client_reference_id: eventId,
            metadata: {
                eventId: event._id.toString(),
                orgId: event.orgId.toString(),
                attendeeName: name,
                email: email.toLowerCase(),
                phone: phone || '',
                organization: organization || ''
            }
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('Stripe session creation error:', err.message);
        res.status(500).json({ message: 'Stripe configuration error. Please ensure your Secret Key is valid.' });
    }
});

// POST /api/payment/verify
// Public endpoint for frontend to verify payment success and commit registration
router.post('/verify', async (req, res, next) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID is required.' });
        }

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session || session.payment_status !== 'paid') {
            return res.status(400).json({ message: 'Payment not successful or session invalid.' });
        }

        const { eventId, orgId, attendeeName, email, phone, organization } = session.metadata;

        // Ensure we haven't already processed this session implicitly by checking if user exists
        const existingReg = await Registration.findOne({ email, eventId, status: 'REGISTERED' });
        if (existingReg) {
            return res.json({ message: 'Registration already processed.', registration: existingReg });
        }

        // Check capacity one last time just to be safe
        const count = await Registration.countDocuments({ eventId, status: 'REGISTERED' });
        const event = await Event.findById(eventId);
        if (count >= event.capacity) {
            // In a perfect system, we'd refund here. For now, just error.
            return res.status(400).json({ message: 'Event reached capacity during checkout process.' });
        }

        // Create the registration first (without QR codes)
        const newRegistration = await Registration.create({
            eventId,
            orgId,
            attendeeName,
            email,
            phone,
            organization,
            status: 'REGISTERED'
        });

        // Generate QR code
        const { qrCode, qrData } = await qrService.generateQRCode({
            ticketId: newRegistration.ticketId,
            eventId: event._id
        });

        // Upload to Cloudinary (convert base64 data URL to hosted image for reliable email rendering)
        let qrCodeUrl = null;
        try {
            const cloudinary = require('../config/cloudinary');
            const base64String = `data:image/png;base64,${qrCode.replace(/^data:image\/\w+;base64,/, '')}`;
            const uploadRes = await cloudinary.uploader.upload(base64String, {
                folder: 'eventflow/qrcodes',
                public_id: `qr_${newRegistration.ticketId}`,
                resource_type: 'image'
            });
            qrCodeUrl = uploadRes.secure_url;
            console.log(`✅ QR code uploaded (Stripe Checkout): ${qrCodeUrl}`);
        } catch (cloudErr) {
            console.error('⚠️  Cloudinary QR upload failed during Stripe Checkout:', cloudErr.message);
        }

        // Save the QR Data to the registration
        newRegistration.qrCode = qrCodeUrl || qrCode;
        newRegistration.qrData = qrData;
        await newRegistration.save();
        // Send confirmation email (non-blocking)
        emailService.sendRegistrationConfirmation({
            to: email,
            attendeeName,
            eventTitle: event.title,
            eventDate: event.date,
            eventVenue: event.venue,
            qrData: qrData,
            qrCodeUrl: qrCodeUrl
        }).catch(err => console.error('Email error:', err.message));

        res.status(201).json({
            message: 'Payment verified and registration successful.',
            registration: newRegistration
        });

    } catch (err) {
        console.error('Payment verification error:', err.message);
        res.status(500).json({ message: 'Stripe verification error.' });
    }
});

module.exports = router;
