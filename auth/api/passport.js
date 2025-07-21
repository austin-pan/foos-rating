import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from "dotenv";

dotenv.config();

const HOST_URL = process.env.HOST_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

export default (passport) => {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${HOST_URL}/auth/google/callback`
    },
    function(accessToken, refreshToken, profile, cb) {
      if (profile._json.email.endsWith(`@${process.env.EMAIL_DOMAIN}`)) {
        return cb(null, profile._json);
      }
      return cb(null, false);
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
}