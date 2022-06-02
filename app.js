const path = require('path');
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // for accessing environment variables
const socketio = require('socket.io');
const authRoutes = require('./routes/authRoutes/authRoutes');
const authProvidersRoutes = require('./routes/authRoutes/authProvidersRoutes');
const tokenGeneration = require('./middleware/auth/tokenGeneration');
const chatHandler = require('./socketEventHandlers/chatHandler');
const messageHandler = require('./socketEventHandlers/messageHandler');
const userHandler = require('./socketEventHandlers/userHandler');
const joinRoomHandler = require('./socketEventHandlers/joinRoomHandler');
const leaveRoomHandler = require('./socketEventHandlers/leaveRoomHandler');
const checkPendingMessageHandler = require('./socketEventHandlers/checkPendingMessageHandler');
const messageSyncHandler = require('./socketEventHandlers/messageSyncHandler');

const port = process.env.PORT || 3300;

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: [
      'https://msgbits.com',
      'https://www.msgbits.com',
      'http://localhost:3000',
      'http://192.168.29.250:3000',
    ],
    credentials: true,
  },
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('connected to mongodb server.'))
  .catch(() => console.error.bind(console, 'MongoDB connection error.'));

// now we don't use body-parser instead we use express built-in express.json()
// express.urlencoded() for decoding default encyted data form form i.e. application/x-www-form-urlencoded.

app.use(cookieParser()); // it populate cookies in req object which contains cookies sent by client.
app.use(express.json()); // it parses incoming requests with JSON payloads.
//  it encodes forms's default application/x-www-form-urlencoded.
app.use(express.urlencoded({ extended: true }));
// for allowing other domains to see our resources(endpoints)
app.use(
  cors({
    origin: [
      'https://msgbits.com',
      'https://www.msgbits.com',
      'http://localhost:3000',
      'http://192.168.29.250:3000',
    ],
    credentials: true,
  })
);

// app.set('trust proxy', 1);
// for serving static files creates dedicated routes for files.
// app.use(express.static("public"));
// http://localhost:3300/style.css
// app.use('/assets', express.static('public'));
//  http://localhost:3300/assets/style.css

// app.use(getData);  custom middleware.

// app.set('view engine', 'ejs');
//  populate accessToken refreshToken and user in request.
app.use(tokenGeneration);
//  routes
app.use(authRoutes);
app.use('/auth', authProvidersRoutes);

app.use(express.static('../frontend/build'));
app.get('/*', async (req, res) => {
  console.log('mola');
  console.log('params ', req.params);
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
//  mongodb change stream logic

//  socket logic
io.on('connection', (socket) => {
  console.log('A new connection is  made : ', socket.id);
  joinRoomHandler(io, socket);
  chatHandler(io, socket);
  messageSyncHandler(io, socket);
  checkPendingMessageHandler(io, socket);
  messageHandler(io, socket);
  userHandler(io, socket);
  leaveRoomHandler(io, socket);
});

// message handler
// dbMessageHandler(io);

server.listen(port, () => {
  console.log(`server running on ${port}`);
});
