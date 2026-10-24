const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civictrack';
    const conn = await mongoose.connect(uri);
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[DB Error] ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
