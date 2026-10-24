require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const connectDB = require('./config/db');
const { startEscalationJob } = require('./utils/escalationJob');

const app = express();

// Trust reverse proxy (needed for Render/Railway/Heroku HTTPS headers & cookies)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public
app.use(express.static(path.join(__dirname, 'public')));

// Serve rti-template.xsl directly from root
app.get('/rti-template.xsl', (req, res) => {
  res.sendFile(path.join(__dirname, 'rti-template.xsl'));
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'civictrack_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,      // set true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/authorities', require('./routes/authorities'));
app.use('/api/export', require('./routes/export'));

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

app.get('/pages/:page', (req, res) => {
  const page = req.params.page;
  const allowedPages = [
    'index.html', 'report.html', 'issue.html', 'login.html', 'register.html',
    'citizen-dashboard.html', 'authority-dashboard.html', 'leaderboard.html'
  ];
  if (allowedPages.includes(page)) {
    res.sendFile(path.join(__dirname, 'public/pages', page));
  } else {
    res.status(404).send('Page not found');
  }
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File size exceeds 5MB limit.' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  return res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
});

// Start background escalation cron job
startEscalationJob();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`CivicTrack server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});

module.exports = app;
