const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit Indian mobile number!`
    }
  },
  ward: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'authority', 'admin'], 
    default: 'citizen' 
  },
  department: { type: String, default: null }, // only for authority role
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
