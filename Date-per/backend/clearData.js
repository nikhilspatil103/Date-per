require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
})
  .then(async () => {
    console.log('MongoDB connected');
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('messages').deleteMany({});
    console.log('All data cleared');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
