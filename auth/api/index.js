import express from "express";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import cors from 'cors';
import dotenv from 'dotenv';

import googleAuth from "./passport.js";
import { methodAuth } from "./middleware.js";
import serviceProxy from "./proxy.js";

dotenv.config();

const app = express();

// Apply CORS middleware with explicit configuration
const corsOptions = {
  origin: process.env.ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

app.set('trust proxy', 1); // Needed for secure cookies on Vercel

/* Middleware */
app.use(cors(corsOptions));

const pgSession = connectPgSimple(session);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new pgSession({
    conString: process.env.DB_URL,
    createTableIfMissing: true,
    tableName: "session"
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Only true in production
    sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 30 * 1000, // 1 month
  }
}));
app.use(passport.initialize());
app.use(passport.session());
googleAuth(passport);

app.use('/api', methodAuth, serviceProxy);

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.HOME_URL}/` }),
  (req, res) => { res.redirect(`${process.env.HOME_URL}/`) }
);

app.get('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect(`${process.env.HOME_URL}/`);
  });
});

app.get('/user', (req, res) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      authenticated: false,
      error: 'User not found'
    })
  }
});

// const PORT = 4000;
// app.listen(PORT, () => {
    // console.log(`Server running on port ${PORT}`);
// });

export default app;
