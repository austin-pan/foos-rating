import express from "express";
import passport from "passport";
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import googleAuth from "./passport.js";
import { jwtAuth, methodAuth } from "./middleware.js";
import serviceProxy from "./proxy.js";

dotenv.config();

const app = express();

// Apply CORS middleware with explicit configuration
const corsOptions = {
  origin: process.env.ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(passport.initialize());
googleAuth(passport);

app.use('/api', methodAuth, serviceProxy);

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email'], session: false })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.HOME_URL}/`, session: false }),
  (req, res) => {
    const token = jwt.sign(
      { user: req.user },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.redirect(`${process.env.ORIGIN}/foos-rating/auth/success?token=${token}`)
  }
);

app.get('/user',
  jwtAuth,
  (req, res) => {
    res.json({
      authenticated: true,
      user: req.user
    });
  },
  (err, req, res, next) => {
    res.json({
      authenticated: false,
      error: 'User not found'
    });
  }
);

export default app;
