import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import { 
  hashPassword, 
  comparePasswords, 
  generateVerificationToken, 
  getVerificationTokenExpiry, 
  sendVerificationEmail,
  isTokenExpired
} from "./auth-utils";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const MemoryStore = createMemoryStore(session);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "techlearn-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isVerified: false,
      });

      // Generate and set verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);

      // Send verification email
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          ...user,
          verificationEmailSent: emailSent
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Login user
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(400).json({ message: "Invalid username or password" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout user
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Request password reset
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal whether the email exists
        return res.status(200).json({ message: "If your email is registered, you will receive a reset link" });
      }

      const resetToken = randomBytes(32).toString("hex");
      const now = new Date();
      const expiry = new Date(now.getTime() + 3600000); // 1 hour from now

      await storage.updateResetToken(user.id, resetToken, expiry);
      
      // In a real app, you would send an email with the reset link
      // For this demo, we'll just return the token
      res.status(200).json({ 
        message: "If your email is registered, you will receive a reset link",
        token: resetToken // In production, remove this and send via email
      });
    } catch (error) {
      next(error);
    }
  });

  // Reset password
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      const user = await storage.getUserByResetToken(token);
      
      if (!user || !user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updatePassword(user.id, hashedPassword);
      await storage.clearResetToken(user.id);

      res.status(200).json({ message: "Password has been reset" });
    } catch (error) {
      next(error);
    }
  });

  // Email Verification
  app.get("/api/verify-email", async (req, res, next) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token as string);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      if (!user.verificationExpiry || isTokenExpired(new Date(user.verificationExpiry))) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      await storage.verifyUser(user.id);
      
      // If user is logged in, update their session
      if (req.isAuthenticated() && req.user.id === user.id) {
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser) {
          req.user = updatedUser;
        }
      }

      // Redirect to the frontend verification success page
      res.redirect('/verification-success');
    } catch (error) {
      next(error);
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      
      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate and set new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);

      // Send verification email
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );

      if (emailSent) {
        res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Check authentication for admin routes
  app.use('/api/admin/*', (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  });
}
