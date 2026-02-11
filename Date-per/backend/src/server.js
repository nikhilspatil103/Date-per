require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const messagesRoutes = require('./routes/messages');
const nearbyRoutes = require('./routes/nearby');
const userRoutes = require('./routes/user');
const likesRoutes = require('./routes/likes');
const notificationsRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const Message = require('./models/Message');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGODB_URI, {
  tls: true,
  tlsAllowInvalidCertificates: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/nearby', nearbyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api', uploadRoutes);
app.use('/api/likes', (req, res, next) => {
  req.io = io;
  next();
}, likesRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.join(decoded.userId);
      
      await User.findByIdAndUpdate(decoded.userId, { online: true, lastSeen: new Date() });
      io.emit('userOnline', { userId: decoded.userId });
      
      console.log('User authenticated and joined room:', decoded.userId);
    } catch (err) {
      console.error('Auth error:', err);
    }
  });

  socket.on('sendMessage', async (data) => {
    try {
      console.log('Received sendMessage:', data);
      const message = new Message({
        sender: data.sender,
        receiver: data.receiver,
        text: data.text
      });
      await message.save();
      console.log('Message saved:', message._id);
      
      console.log('Emitting to receiver room:', data.receiver);
      console.log('All rooms:', io.sockets.adapter.rooms);
      io.to(data.receiver).emit('newMessage', {
        _id: message._id,
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
        createdAt: message.createdAt
      });
      
      socket.emit('messageSent', {
        _id: message._id,
        sender: data.sender,
        receiver: data.receiver,
        text: data.text,
        createdAt: message.createdAt
      });
      console.log('Message sent to both parties');
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { online: false, lastSeen: new Date() });
      io.emit('userOffline', { userId: socket.userId });
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'DatePer API is running' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
