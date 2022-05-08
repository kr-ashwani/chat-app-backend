const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // for accessing environment variables
const authRoutes = require('./routes/authRoutes/authRoutes');
const authProvidersRoutes = require('./routes/authRoutes/authProvidersRoutes');
const apiRoutes = require('./routes/api/apiRoutes');
const tokenGeneration = require('./middleware/auth/tokenGeneration');

const port = process.env.PORT || 3300;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('connected to mongodb server.'))
  .catch(() => console.error.bind(console, 'MongoDB connection error.'));

// now we don't use body-parser instead we use express built-in express.json()
// express.urlencoded() for decoding default encyted data form form i.e. application/x-www-form-urlencoded.

const app = express();
app.use(cookieParser()); // it populate cookies in req object which contains cookies sent by client.
app.use(express.json()); // it parses incoming requests with JSON payloads.
//  it encodes forms's default application/x-www-form-urlencoded.
app.use(express.urlencoded({ extended: true }));
// for allowing other domains to see our resources(endpoints)
app.use(
  cors({
    origin: [
      'http://192.168.29.250:3000',
      'http://localhost:3000',
      'https://jwt-login-app.netlify.app/',
    ],
    credentials: true,
  })
);
// for serving static files creates dedicated routes for files.
// app.use(express.static("public"));
// http://localhost:3300/style.css
app.use('/assets', express.static('public'));
//  http://localhost:3300/assets/style.css

// app.use(getData);  custom middleware.

app.set('view engine', 'ejs');
//  populate accessToken refreshToken and user in request.
app.use(tokenGeneration);
//  routes
app.get('/', async (req, res) => {
  res.render('home');
});
app.use(authRoutes);
app.use('/auth', authProvidersRoutes);
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`server running on ${port}`);
});
