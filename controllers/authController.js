const bcrypt = require('bcryptjs');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, ward } = req.body;

    if (!name || !email || !password || !phone || !ward) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Name validation
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return res.status(400).json({ success: false, error: 'Name must contain only letters and spaces.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }

    // Password validation: minimum 6 chars, at least one digit
    if (!/^(?=.*\d).{6,}$/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long and contain at least one number.' });
    }

    // Phone validation: Indian mobile number regex
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, error: 'Phone number must be a valid 10-digit Indian mobile number.' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email is already registered.' });
    }

    // Role can only be 'citizen' — authority accounts are seeded only
    const role = 'citizen';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      ward: ward.trim(),
      role: role
    });

    await user.save();

    return res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      ward: user.ward,
      department: user.department || null
    };

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ward: user.ward
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during login.' });
  }
};

const logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Could not log out. Please try again.' });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Logged out successfully.' });
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error during logout.' });
  }
};

const getMe = (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ success: false, error: 'Not authenticated.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error.' });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
