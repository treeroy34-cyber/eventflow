const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true },
    endDate: { type: Date },
    venue: { type: String, default: '' },
    capacity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    gallery: [{ type: String }],
    category: { type: String, default: 'General' },
    isPublished: { type: Boolean, default: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    tags: [{ type: String }],
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Indexes for fast pub event listing and org-scoped queries
eventSchema.index({ orgId: 1, createdAt: -1 });
eventSchema.index({ isPublished: 1, status: 1, date: 1 });
eventSchema.index({ title: 'text', description: 'text' }); // full-text search

module.exports = mongoose.model('Event', eventSchema);
