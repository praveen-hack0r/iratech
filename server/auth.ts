import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
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
  sendPasswordResetEmail,
  isTokenExpired
} from "./auth-utils";

// Firebase Admin SDK for verifying Google tokens
import admin from "firebase-admin";

// Initialize Firebase Admin SDK if credentials are provided
if (process.env.VITE_FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "techlearn-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
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
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          console.log(`Attempting login for email: ${email}`);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`User not found for email: ${email}`);
            return done(null, false);
          }
          
          console.log(`Found user: ${user.email}, checking password...`);
          const isValidPassword = await comparePasswords(password, user.password);
          console.log(`Password comparison result: ${isValidPassword}`);
          
          if (!isValidPassword) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          console.error("Login error:", error);
          return done(error);
        }
      }
    ),
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
      console.log("Registration attempt with email:", req.body.email);
      
      // Only check for email uniqueness since username doesn't need to be unique
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        console.log("Registration failed: Email already in use");
        return res.status(400).json({ message: "Email already in use" });
      }

      console.log("Creating new user account...");
      
      // Create the user with hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isVerified: false,
      });
      
      console.log("User created with ID:", user.id);

      // Generate and set verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      console.log("Generated verification token for user ID:", user.id);
      console.log("Token expiry:", tokenExpiry);
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);
      console.log("Verification token stored in database");

      // Send verification email
      console.log("Sending verification email to:", user.email);
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );
      
      console.log("Verification email sending result:", emailSent ? "Success" : "Failed");

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
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
      
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
  
  // Google Sign-In authentication
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      // Verify the Firebase ID token
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "No ID token provided" });
      }
      
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { email, name, picture, uid } = decodedToken;
      
      if (!email) {
        return res.status(400).json({ message: "No email found in the ID token" });
      }
      
      console.log(`Google authentication for email: ${email}`);
      
      // Check if the user exists in our database
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create a new user if they don't exist
        console.log(`Creating new user for Google account: ${email}`);
        
        // Generate a random password, as we won't use it for Google auth
        const randomPassword = randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);
        
        // Split the name into first and last name if available
        let firstName = "", lastName = "";
        if (name) {
          const nameParts = name.split(' ');
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(' ') || "";
        }
        
        // Create username from email
        const username = email.split('@')[0];
        
        user = await storage.createUser({
          username,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "user",
          isVerified: true, // Google accounts are already verified
        });
        
        console.log(`Created new user with ID: ${user.id}`);
      } else {
        console.log(`Existing user found for Google account: ${email}`);
        
        // Update the user's verification status if needed
        if (!user.isVerified) {
          console.log(`Updating verification status for user: ${user.id}`);
          user = await storage.updateUser(user.id, { isVerified: true });
        }
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
      
    } catch (error) {
      console.error("Google authentication error:", error);
      return res.status(401).json({ message: "Invalid Google token" });
    }
  });
  
  // Update user profile
  app.put("/api/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const { firstName, lastName, email, phoneNumber } = req.body;
      
      // Validate if the updated email already exists (if email is being changed)
      if (email !== req.user.email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Update the user profile
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        email,
        phoneNumber
      });
      
      // Update session user
      req.login(updatedUser, (err) => {
        if (err) return next(err);
        res.json(updatedUser);
      });
    } catch (error) {
      next(error);
    }
  });

  // This section was removed as it was a duplicate of the more complete implementation below

  // Email Verification
  app.get("/api/verify-email", async (req, res, next) => {
    try {
      console.log("Email verification request received");
      console.log("Full URL:", req.protocol + '://' + req.get('host') + req.originalUrl);
      
      // Extract both token and email from the query string for better matching
      const { token, email } = req.query;
      
      // Log the verification data with partial token for security
      if (token) {
        const tokenString = token as string;
        const tokenPreview = tokenString.length > 12 
          ? `${tokenString.substring(0, 6)}...${tokenString.substring(tokenString.length - 6)}`
          : tokenString;
        console.log("Verification data:", { tokenPreview, email: email || 'missing' });
      } else {
        console.log("Verification data: token missing, email:", email || 'missing');
      }
      
      if (!token) {
        console.log("Verification failed: No token provided");
        
        // Instead of returning a JSON error, redirect to a user-friendly page
        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Failed - IraTech</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                line-height: 1.6; 
                background-color: #f9fafb;
                color: #111827;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              h1 { 
                color: #dc2626;
                margin-bottom: 20px;
              }
              .error-icon { 
                font-size: 64px; 
                color: #dc2626;
                margin-bottom: 20px; 
              }
              .message { 
                margin-bottom: 30px; 
              }
              .button { 
                display: inline-block; 
                background-color: #4F46E5; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                font-weight: bold;
                margin: 10px;
                transition: background-color 0.3s ease;
              }
              .button:hover {
                background-color: #4338ca;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">✗</div>
              <h1>Verification Failed</h1>
              <div class="message">
                <p>The verification link is invalid or incomplete. No verification token was provided.</p>
                <p>Please check your email and try clicking the verification link again, or request a new verification email.</p>
              </div>
              <div class="actions">
                <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/auth" class="button">Go to Login Page</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      // Enhanced user lookup for verification
      console.log("Looking up user by verification token...");
      let user = await storage.getUserByVerificationToken(token as string);
      
      // If email is provided and user not found by token, try finding by email
      if (!user && email) {
        console.log("Token lookup failed, trying to find user by email...");
        const userByEmail = await storage.getUserByEmail(email as string);
        
        if (userByEmail && userByEmail.verificationToken === token) {
          console.log("User found by email and token matches");
          user = userByEmail;
        } else if (userByEmail) {
          console.log("User found by email but token doesn't match");
          console.log("Expected token:", userByEmail.verificationToken ? 
            `${userByEmail.verificationToken.substring(0, 6)}...${userByEmail.verificationToken.substring(userByEmail.verificationToken.length - 6)}` : 
            'null');
        }
      }
      
      if (!user) {
        console.log("Verification failed: Invalid token, no matching user found");
        
        // Log all users and their verification tokens for debugging
        console.log("Debugging: Checking all user verification tokens...");
        const allUsers = await storage.getAllUsers();
        
        for (const u of allUsers) {
          if (u.verificationToken) {
            const tokenPreview = `${u.verificationToken.substring(0, 6)}...${u.verificationToken.substring(u.verificationToken.length - 6)}`;
            console.log(`User ${u.id} (${u.email}): Token ${tokenPreview}`);
            
            // Try token normalization and comparison
            const normalizedTokenFromRequest = (token as string).trim();
            const normalizedTokenFromUser = u.verificationToken.trim();
            
            if (normalizedTokenFromRequest === normalizedTokenFromUser) {
              console.log("Found matching token after normalization!");
              user = u;
              break;
            }
          } else {
            console.log(`User ${u.id} (${u.email}): No verification token`);
          }
        }
        
        // If still no user found, return error
        if (!user) {
          return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verification Failed - IraTech</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 40px; 
                  line-height: 1.6; 
                  background-color: #f9fafb;
                  color: #111827;
                }
                .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background-color: white;
                  padding: 30px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 { 
                  color: #dc2626;
                  margin-bottom: 20px;
                }
                .error-icon { 
                  font-size: 64px; 
                  color: #dc2626;
                  margin-bottom: 20px; 
                }
                .message { 
                  margin-bottom: 30px; 
                }
                .button { 
                  display: inline-block; 
                  background-color: #4F46E5; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 4px; 
                  font-weight: bold;
                  margin: 10px;
                  transition: background-color 0.3s ease;
                }
                .button:hover {
                  background-color: #4338ca;
                }
                .code {
                  background-color: #f3f4f6;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="error-icon">✗</div>
                <h1>Verification Failed</h1>
                <div class="message">
                  <p>No user was found with the provided verification token.</p>
                  <p>The token may be invalid, expired, or already used.</p>
                  ${email ? `<p>We couldn't verify the account for <span class="code">${email}</span>.</p>` : ''}
                  <p>Please try requesting a new verification email from your account settings.</p>
                </div>
                <div class="actions">
                  <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/auth" class="button">Go to Login Page</a>
                </div>
              </div>
            </body>
            </html>
          `);
        }
      }

      console.log("User found for verification:", user.id, user.email);
      
      // Check if already verified
      if (user.isVerified) {
        console.log("User already verified:", user.id);
        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Already Verified - IraTech</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                line-height: 1.6; 
                background-color: #f9fafb;
                color: #111827;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              h1 { 
                color: #4F46E5; 
                margin-bottom: 20px;
              }
              .info-icon { 
                font-size: 64px; 
                color: #3b82f6; 
                margin-bottom: 20px; 
              }
              .message { 
                margin-bottom: 30px; 
              }
              .button { 
                display: inline-block; 
                background-color: #4F46E5; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                font-weight: bold;
                margin: 10px;
                transition: background-color 0.3s ease;
              }
              .button:hover {
                background-color: #4338ca;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="info-icon">ℹ</div>
              <h1>Email Already Verified</h1>
              <div class="message">
                <p>Your email address <strong>${user.email}</strong> has already been verified.</p>
                <p>You can continue using all the features of your IraTech account.</p>
              </div>
              <div class="actions">
                <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/auth" class="button">Go to Login Page</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }
      
      if (!user.verificationExpiry) {
        console.log("Verification failed: No expiry date for token");
        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Failed - IraTech</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                line-height: 1.6; 
                background-color: #f9fafb;
                color: #111827;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              h1 { 
                color: #dc2626;
                margin-bottom: 20px;
              }
              .error-icon { 
                font-size: 64px; 
                color: #dc2626;
                margin-bottom: 20px; 
              }
              .message { 
                margin-bottom: 30px; 
              }
              .button { 
                display: inline-block; 
                background-color: #4F46E5; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                font-weight: bold;
                margin: 10px;
                transition: background-color 0.3s ease;
              }
              .button:hover {
                background-color: #4338ca;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">✗</div>
              <h1>Verification Failed</h1>
              <div class="message">
                <p>The verification token is invalid or incomplete.</p>
                <p>Please request a new verification email from your account settings.</p>
              </div>
              <div class="actions">
                <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/auth" class="button">Go to Login Page</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }
      
      const expiry = new Date(user.verificationExpiry);
      const expired = isTokenExpired(expiry);
      
      console.log("Token expiry:", expiry);
      console.log("Token expired:", expired);
      
      if (expired) {
        console.log("Verification failed: Token has expired");
        return res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Expired - IraTech</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px; 
                line-height: 1.6; 
                background-color: #f9fafb;
                color: #111827;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              h1 { 
                color: #f97316;
                margin-bottom: 20px;
              }
              .warning-icon { 
                font-size: 64px; 
                color: #f97316;
                margin-bottom: 20px; 
              }
              .message { 
                margin-bottom: 30px; 
              }
              .button { 
                display: inline-block; 
                background-color: #4F46E5; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                font-weight: bold;
                margin: 10px;
                transition: background-color 0.3s ease;
              }
              .button:hover {
                background-color: #4338ca;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="warning-icon">⚠</div>
              <h1>Verification Link Expired</h1>
              <div class="message">
                <p>The verification link for <strong>${user.email}</strong> has expired.</p>
                <p>For security reasons, verification links expire after 24 hours.</p>
                <p>Please log in to your account and request a new verification email.</p>
              </div>
              <div class="actions">
                <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/auth" class="button">Go to Login Page</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      console.log("Verifying user account...");
      await storage.verifyUser(user.id);
      console.log("User verified successfully");
      
      // If user is logged in, update their session
      if (req.isAuthenticated() && req.user.id === user.id) {
        console.log("Updating user session with verified status");
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser) {
          req.user = updatedUser;
        }
      }

      // Directly show success message rather than redirecting
      console.log("Showing verification success page");
      
      // Send a complete HTML response with inline styles
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified - IraTech</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 40px; 
              line-height: 1.6; 
              background-color: #f9fafb;
              color: #111827;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 { 
              color: #4F46E5; 
              margin-bottom: 20px;
            }
            .success-icon { 
              font-size: 64px; 
              color: #10B981; 
              margin-bottom: 20px; 
            }
            .message { 
              margin-bottom: 30px; 
            }
            .button { 
              display: inline-block; 
              background-color: #4F46E5; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              font-weight: bold;
              margin: 10px;
              transition: background-color 0.3s ease;
            }
            .button:hover {
              background-color: #4338ca;
            }
            .secondary-button {
              display: inline-block; 
              background-color: #e5e7eb;
              color: #374151; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 4px; 
              font-weight: bold;
              margin: 10px;
              transition: background-color 0.3s ease;
            }
            .secondary-button:hover {
              background-color: #d1d5db;
            }
            .actions {
              margin-top: 20px;
            }
            .highlight {
              color: #4F46E5;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Email Successfully Verified!</h1>
            <div class="message">
              <p>Thank you for verifying your email address. Your IraTech account is now fully activated!</p>
              <p>You now have access to all our premium learning resources, including:</p>
              <p>
                <span class="highlight">Hacking tutorials</span> • 
                <span class="highlight">Coding courses</span> • 
                <span class="highlight">Excel with AI</span> • 
                <span class="highlight">Digital Marketing</span>
              </p>
              <p>Start your learning journey today and unlock your full potential!</p>
            </div>
            <div class="actions">
              <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/" class="button">Go to Homepage</a>
              <a href="https://${process.env.REPL_ID}-00-${process.env.REPL_OWNER}.repl.co/courses" class="secondary-button">Browse Courses</a>
            </div>
          </div>
        </body>
        </html>
      `);
      

    } catch (error) {
      console.error("Error during email verification:", error);
      next(error);
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      console.log("Resend verification email request received");
      
      if (!req.isAuthenticated()) {
        console.log("Resend failed: User not authenticated");
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user;
      console.log("User requesting verification resend:", user.id, user.email);
      
      if (user.isVerified) {
        console.log("Resend failed: Email already verified");
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate and set new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      console.log("Generated new verification token");
      console.log("Token expiry:", tokenExpiry);
      
      await storage.setVerificationToken(user.id, verificationToken, tokenExpiry);
      console.log("Verification token stored in database");

      // Send verification email
      console.log("Sending verification email to:", user.email);
      const emailSent = await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );
      
      console.log("Verification email sending result:", emailSent ? "Success" : "Failed");

      if (emailSent) {
        res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error("Error in resend verification:", error);
      next(error);
    }
  });
  
  // Password reset request route
  app.post("/api/forgot-password", async (req, res, next) => {
    try {
      console.log("Password reset request received");
      const { email } = req.body;
      
      console.log("Email provided for password reset:", email);
      
      if (!email) {
        console.log("Password reset failed: No email provided");
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find the user by email
      console.log("Looking up user by email...");
      const user = await storage.getUserByEmail(email);
      
      // For security, don't reveal if the email exists or not
      if (!user) {
        console.log("Password reset: User not found for email", email);
        return res.status(200).json({ 
          message: "If your email is registered, you will receive a reset link" 
        });
      }
      
      console.log("User found for password reset:", user.id);
      
      // Generate a reset token
      const resetToken = generateVerificationToken();
      const tokenExpiry = getVerificationTokenExpiry();
      
      console.log("Generated password reset token");
      console.log("Token expiry:", tokenExpiry);
      
      // Save the reset token
      console.log("Storing password reset token in database");
      await storage.setPasswordResetToken(user.id, resetToken, tokenExpiry);
      
      // Send the reset email
      console.log("Sending password reset email to:", user.email);
      const emailSent = await sendPasswordResetEmail(
        user.email,
        resetToken
      );
      
      console.log("Password reset email sending result:", emailSent ? "Success" : "Failed");
      
      if (!emailSent) {
        console.error("Failed to send password reset email");
      }
      
      // Always return success for security reasons
      res.status(200).json({ 
        message: "If your email is registered, you will receive a reset link" 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Manual verification route
  app.post("/api/verify-email-manual", async (req, res, next) => {
    try {
      console.log("Manual email verification request received");
      const { token, email } = req.body;
      
      console.log("Verification data:", {
        token: token ? `${token.substring(0, 6)}...${token.substring(token.length - 6)}` : 'missing',
        email: email || 'missing'
      });
      
      if (!token || !email) {
        console.log("Verification failed: No token or email provided");
        return res.status(400).json({ 
          message: "Verification token and email are required",
          details: {
            token: token ? "provided" : "missing",
            email: email ? "provided" : "missing"
          }
        });
      }

      console.log("Looking up user by email...");
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log("Verification failed: No user found with email", email);
        return res.status(400).json({ 
          message: "No account found with this email address. Please make sure you're using the same email you registered with.",
          error: "user_not_found"
        });
      }
      
      console.log("User found for verification:", user.id, user.email);
      console.log("User verification status:", user.isVerified ? "Already verified" : "Not verified");
      
      // If user is already verified, return success
      if (user.isVerified) {
        console.log("User already verified:", user.id);
        return res.status(200).json({ 
          message: "Your email is already verified. You can now log in to your account.",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            isVerified: true
          },
          status: "already_verified"
        });
      }
      
      // Check if verification token exists
      if (!user.verificationToken) {
        console.log("Verification failed: User has no verification token");
        return res.status(400).json({ 
          message: "No verification token found for this account. Please register again or contact support.",
          error: "no_token_found"
        });
      }
      
      // Log partial token for debugging (safe to log parts of the token)
      const dbTokenPreview = user.verificationToken 
        ? `${user.verificationToken.substring(0, 6)}...${user.verificationToken.substring(user.verificationToken.length - 6)}`
        : 'null';
      console.log("Token comparison:", {
        providedTokenLength: token.length,
        databaseTokenLength: user.verificationToken?.length || 0,
        tokenPreviewFromDB: dbTokenPreview
      });
      
      if (user.verificationToken !== token) {
        console.log("Verification failed: Token doesn't match");
        return res.status(400).json({ 
          message: "The verification token is invalid. Please make sure you've copied it correctly from the email.",
          error: "token_mismatch"
        });
      }
      
      if (!user.verificationExpiry) {
        console.log("Verification failed: No expiry date for token");
        return res.status(400).json({ 
          message: "The verification token is invalid. Please request a new verification email.",
          error: "no_expiry_date"
        });
      }
      
      const expiry = new Date(user.verificationExpiry);
      const expired = isTokenExpired(expiry);
      
      console.log("Token expiry information:", {
        expiryDate: expiry.toISOString(),
        currentDate: new Date().toISOString(),
        isExpired: expired
      });
      
      if (expired) {
        console.log("Verification failed: Token has expired");
        return res.status(400).json({ 
          message: "This verification link has expired. Please request a new verification email.",
          error: "token_expired"
        });
      }
      
      // Mark user as verified and clear verification token
      console.log("Marking user as verified:", user.id);
      await storage.verifyUser(user.id);
      
      console.log("User successfully verified:", user.id);
      
      // If user is currently logged in, update session
      if (req.isAuthenticated() && req.user.id === user.id) {
        const updatedUser = await storage.getUser(user.id);
        if (updatedUser) {
          req.user = updatedUser;
        }
      }
      
      // Return success response
      res.status(200).json({ 
        message: "Email successfully verified! You can now log in to your account.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: true
        },
        status: "verified_success"
      });
    } catch (error) {
      console.error("Error during manual email verification:", error);
      res.status(500).json({
        message: "An unexpected error occurred during email verification. Please try again later.",
        error: "server_error"
      });
    }
  });

  // Reset password route
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      console.log("Password reset submission received");
      const { token, password } = req.body;
      
      console.log("Reset token provided:", token ? "Yes" : "No");
      console.log("New password provided:", password ? "Yes" : "No");
      
      if (!token || !password) {
        console.log("Password reset failed: Missing token or password");
        return res.status(400).json({ message: "Token and password are required" });
      }
      
      // Find user by reset token
      console.log("Looking up user by reset token...");
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        console.log("Password reset failed: Invalid token, no matching user found");
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log("User found for password reset:", user.id, user.email);
      
      // Check if token is expired
      if (!user.resetTokenExpiry) {
        console.log("Password reset failed: No expiry date for token");
        return res.status(400).json({ message: "Invalid reset token" });
      }
      
      const expiry = new Date(user.resetTokenExpiry);
      const expired = isTokenExpired(expiry);
      
      console.log("Token expiry:", expiry);
      console.log("Token expired:", expired);
      
      if (expired) {
        console.log("Password reset failed: Token has expired");
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Hash the new password
      console.log("Hashing new password...");
      const hashedPassword = await hashPassword(password);
      
      // Update the password and clear the reset token
      console.log("Updating password and clearing reset token...");
      await storage.updatePasswordAndClearResetToken(user.id, hashedPassword);
      
      console.log("Password reset successful for user:", user.id);
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "An error occurred" });
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
