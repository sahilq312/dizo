
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createRoom', ({ roomId, userId, userName, userColor }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: [],
        shapes: []
      });
    }

    const room = rooms.get(roomId);
    const user = { id: userId, name: userName, color: userColor };
    room.users.push(user);
    
    socket.join(roomId);
    socket.data.currentRoom = roomId;
    socket.data.userId = userId;

    io.to(socket.id).emit('roomJoined', {
      roomId,
      users: room.users
    });
  });

  socket.on('joinRoom', ({ roomId, userId, userName, userColor }) => {
    if (!rooms.has(roomId)) {
      io.to(socket.id).emit('error', { message: 'Room does not exist' });
      return;
    }

    const room = rooms.get(roomId);
    const user = { id: userId, name: userName, color: userColor };
    room.users.push(user);
    
    socket.join(roomId);
    socket.data.currentRoom = roomId;
    socket.data.userId = userId;

    io.to(socket.id).emit('roomJoined', {
      roomId,
      users: room.users
    });

    io.to(socket.id).emit('initialShapes', room.shapes);

    socket.to(roomId).emit('userJoined', {
      user,
      users: room.users
    });
  });

  socket.on('drawShape', ({ roomId, shape }) => {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    room.shapes.push(shape);
    
    socket.to(roomId).emit('drawShape', shape);
  });

  socket.on('updateShape', ({ roomId, shape }) => {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    const shapeIndex = room.shapes.findIndex(s => s.id === shape.id);
    
    if (shapeIndex !== -1) {
      room.shapes[shapeIndex] = shape;
      
      socket.to(roomId).emit('updateShape', shape);
    }
  });

  socket.on('clearCanvas', ({ roomId }) => {
    if (!rooms.has(roomId)) return;
    
    const room = rooms.get(roomId);
    room.shapes = [];
    
    socket.to(roomId).emit('clearCanvas');
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.currentRoom;
    const userId = socket.data.userId;
    
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      
      room.users = room.users.filter(user => user.id !== userId);
      
      io.to(roomId).emit('userLeft', {
        userId,
        users: room.users
      });
      
      if (room.users.length === 0) {
        rooms.delete(roomId);
      }
    }
    
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});