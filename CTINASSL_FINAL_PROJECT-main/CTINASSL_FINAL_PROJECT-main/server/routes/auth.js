// /server/routes/auth.js

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET;

const isProduction = process.env.NODE_ENV === 'production';

const BCRYPT_COST = Number(process.env.BCRYPT_COST || 12);
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const REFRESH_TOKEN_MS = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCKOUT_MS = Number(process.env.LOCKOUT_MS || 15 * 60 * 1000);

const cookieSameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: cookieSameSite,
  path: '/',
  maxAge: REFRESH_TOKEN_MS,
};

const xsrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: cookieSameSite,
  path: '/',
  maxAge: REFRESH_TOKEN_MS,
};

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  next();
}

function setXsrfCookie(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('XSRF-TOKEN', token, xsrfCookieOptions);
  return token;
}

function requireXsrf(req, res, next) {
  const cookieToken = req.cookies?.['XSRF-TOKEN'];
  const headerToken = req.get('X-CSRF-Token') || req.get('X-XSRF-TOKEN');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

function getPasswordPolicyViolations(password, username) {
  const issues = [];
  if (typeof password !== 'string') {
    issues.push('Password is required');
    return issues;
  }
  if (password.length < 12) issues.push('Password must be at least 12 characters');
  if (password.length > 128) issues.push('Password must be at most 128 characters');
  if (!/[a-z]/.test(password)) issues.push('Password must include a lowercase letter');
  if (!/[A-Z]/.test(password)) issues.push('Password must include an uppercase letter');
  if (!/\d/.test(password)) issues.push('Password must include a number');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('Password must include a symbol');
  if (/\s/.test(password)) issues.push('Password must not contain spaces');
  if (username && typeof username === 'string') {
    const u = username.trim().toLowerCase();
    if (u && password.toLowerCase().includes(u)) {
      issues.push('Password must not contain your username');
    }
  }
  return issues;
}

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_REGISTER_MAX || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_LOGIN_MAX || 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

// Helper functions
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_DAYS}d` }
  );
}

function isSuperAdmin(req) {
  if (!SUPER_ADMIN_SECRET) return false;
  return req.body.superAdminSecret === SUPER_ADMIN_SECRET || req.body.adminSecret === SUPER_ADMIN_SECRET;
}

// --- REGISTER ---
router.post(
  "/register",
  registerLimiter,
  [
    body('username').optional().isString().trim().isLength({ min: 3, max: 30 }),
    body('name').optional().isString().trim().isLength({ min: 1, max: 60 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 1, max: 128 }),
    body('role').optional().isIn(['user', 'admin', 'super-admin']),
  ],
  validate,
  async (req, res) => {
  try {
    // Accept both 'username' and 'name'
    const username = req.body.username || req.body.name;
    const name = req.body.name || req.body.username; // for display
    const { email, password, role = "user", superAdminSecret } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    if (role !== "super-admin" && !email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const passwordIssues = getPasswordPolicyViolations(password, username);
    if (passwordIssues.length > 0) {
      return res.status(400).json({ error: passwordIssues[0] });
    }

    // Role logic
    let userRole = "user";
    if (role === "admin" || role === "super-admin") {
      if (!isSuperAdmin(req)) {
        return res.status(403).json({ error: "Not authorized to create admin/super-admin" });
      }
      userRole = role;
    }

    // Check for existing user/email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already exists" });
      } else if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    // Create user object
    const userObj = {
      username,
      name,
      password: hashedPassword,
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (userRole !== "super-admin") userObj.email = email;

    // Save user
    const user = await User.create(userObj);

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: "User registered successfully"
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- LOGIN ---
router.post(
  "/login",
  loginLimiter,
  [
    body('username').optional().isString().trim().isLength({ min: 1, max: 60 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 1, max: 128 }),
    body('role').optional().isIn(['user', 'admin', 'super-admin']),
  ],
  validate,
  async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    let user;

    if (role === "admin" || role === "super-admin") {
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      user = await User.findOne({ username, role });
    } else {
      if ((!username && !email) || !password) {
        return res.status(400).json({ error: "Username/email and password are required" });
      }
      if (username) {
        user = await User.findOne({ username, role: { $in: ["user", "admin"] } });
      } else if (email) {
        user = await User.findOne({ email, role: { $in: ["user", "admin"] } });
      }
    }
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const nextAttempts = (user.failedLoginAttempts || 0) + 1;
      user.failedLoginAttempts = nextAttempts;
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_MS);
      }
      await user.save();
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Successful login: reset lockout counters
    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expires: new Date(Date.now() + REFRESH_TOKEN_MS),
    });

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    setXsrfCookie(res);

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- CSRF TOKEN (double-submit) ---
router.get('/csrf', (req, res) => {
  const token = setXsrfCookie(res);
  res.json({ csrfToken: token });
});

// --- REFRESH TOKEN ---
router.post("/refresh-token", requireXsrf, async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "No refresh token provided" });

  try {
    // Check if refresh token is in DB
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken)
      return res.status(403).json({ error: "Refresh token not recognized" });

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Optionally: check if token expired in DB (for blacklisting)
    if (storedToken.expires < Date.now()) {
      await storedToken.deleteOne();
      return res.status(403).json({ error: "Refresh token expired" });
    }

    // Issue new access token
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const accessToken = generateAccessToken(user);

    // Rotate refresh token (mitigates replay)
    const newRefreshToken = generateRefreshToken(user);
    await RefreshToken.deleteOne({ token: refreshToken });
    await RefreshToken.create({
      user: user._id,
      token: newRefreshToken,
      expires: new Date(Date.now() + REFRESH_TOKEN_MS),
    });

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
    setXsrfCookie(res);
    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// --- LOGOUT ---
router.post("/logout", requireXsrf, async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    // Remove from DB
    await RefreshToken.deleteOne({ token: refreshToken });
    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: isProduction,
    });
  }
  res.clearCookie('XSRF-TOKEN', xsrfCookieOptions);
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
