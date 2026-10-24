const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, minlength: 20 },
  category: { 
    type: String, 
    enum: ['roads', 'water', 'electricity', 'sanitation', 
           'illegal_construction', 'drainage', 'other'],
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'escalated'],
    default: 'pending'
  },
  escalationLevel: { type: Number, default: 0 }, // 0, 1, or 2
  ward: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number }
  },
  photo: { type: String, default: null }, // relative path to uploaded file
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String
  }],
  createdAt: { type: Date, default: Date.now },
  acknowledgedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Issue', issueSchema);
