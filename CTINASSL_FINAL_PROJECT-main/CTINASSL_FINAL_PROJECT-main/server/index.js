// server/index.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

const isProduction = process.env.NODE_ENV === 'production';
const serveFrontend = process.env.SERVE_FRONTEND === 'true' || isProduction;
const frontendBuildPath = serveFrontend ? path.join(__dirname, '..', 'flicknest-frontend', 'build') : null;
const hasSslConfig = Boolean(process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH);

// Security headers
app.use(
  helmet({
    // Avoid breaking cross-origin asset loading between frontend and API.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        // Directives with no fallback (common scanner finding)
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
        // Other hardening
        "object-src": ["'none'"],
        "script-src": ["'self'"],
        // Explicitly define element directives (no-fallback in some scanners)
        "script-src-elem": ["'self'"],
        // Keep style-src strict; allow inline style attributes separately (React inline styles)
        "style-src": ["'self'"],
        "style-src-elem": ["'self'"],
        "style-src-attr": ["'unsafe-inline'"],
        "img-src": ["'self'", 'data:', 'blob:'],
        "font-src": ["'self'", 'data:'],
        "connect-src": ["'self'"],
        "frame-src": ["'none'"],
        "manifest-src": ["'self'"],
        "media-src": ["'self'"],
        "worker-src": ["'self'", 'blob:'],
        "script-src-attr": ["'none'"],
        "upgrade-insecure-requests": [],
      },
    },
    frameguard: { action: 'deny' },
    hsts: isProduction ? { 
      maxAge: 31536000, 
      includeSubDomains: true, 
      // Only enable preload if explicitly configured (requires submission to hstspreload.org)
      preload: process.env.HSTS_PRELOAD === 'true' 
    } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        payment: ["'none'"],
      },
    },
  })
);

if (process.env.ENFORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const isHttps = req.secure || forwardedProto === 'https';
    if (isHttps) return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// Enforce HTTPS automatically only when local TLS is configured.
// For reverse proxies / load balancers, set ENFORCE_HTTPS=true and ensure they set x-forwarded-proto.
if (isProduction && hasSslConfig && process.env.ENFORCE_HTTPS !== 'false') {
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const isHttps = req.secure || forwardedProto === 'https';
    if (isHttps) return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// CORS: disable by default in production (same-origin deployments) unless explicitly allowlisted.
// Set CORS_ORIGINS to comma-separated list (e.g. "https://app.example.com").
// Set CORS_ORIGINS=none to disable in all environments.
const corsOriginsEnvRaw = (process.env.CORS_ORIGINS || '').trim();
const corsExplicitlyDisabled = corsOriginsEnvRaw.toLowerCase() === 'none';
const enableCors = !corsExplicitlyDisabled && (!isProduction || corsOriginsEnvRaw.length > 0);

if (enableCors) {
  const allowedOrigins = new Set(
    (corsOriginsEnvRaw || 'http://localhost:3000')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (no Origin header) like curl/Postman
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(Object.assign(new Error('Not allowed by CORS'), { statusCode: 403 }));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
    })
  );
}

// Parse JSON and cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Basic abuse protections
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    limit: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

// Prevent common injection vectors
// NOTE: express-mongo-sanitize@2.x is incompatible with Express v5 because it tries
// to reassign req.query (getter-only in Express v5). This custom sanitizer works
// in-place and avoids reassigning req.query/req.params/req.body.
const sanitizeInPlace = (value) => {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) sanitizeInPlace(item);
    return;
  }
  if (typeof value !== 'object') return;

  for (const originalKey of Object.keys(value)) {
    // Basic prototype-pollution guards
    if (originalKey === '__proto__' || originalKey === 'constructor' || originalKey === 'prototype') {
      delete value[originalKey];
      continue;
    }

    const originalVal = value[originalKey];
    const sanitizedKey = originalKey.replace(/[.$]/g, '_');

    if (sanitizedKey !== originalKey) {
      if (value[sanitizedKey] === undefined) {
        value[sanitizedKey] = originalVal;
      }
      delete value[originalKey];
    }

    sanitizeInPlace(value[sanitizedKey] ?? originalVal);
  }
};

app.use((req, _res, next) => {
  sanitizeInPlace(req.body);
  sanitizeInPlace(req.query);
  sanitizeInPlace(req.params);
  next();
});
app.use(hpp());

// Serve static assets (uploaded images)
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Serve React frontend in production mode
if (serveFrontend) {
  if (!isProduction) {
    console.log(`Serving frontend from: ${frontendBuildPath}`);
  }
  
  // Serve static files with proper headers
  app.use(express.static(frontendBuildPath, {
    setHeaders: (res, filePath) => {
      // Security headers are already set by helmet middleware above
      // Add cache control for static assets
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
}

// Connect to MongoDB (no useNewUrlParser/useUnifiedTopology options)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/flicknest')
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check route (only if not serving frontend)
if (!serveFrontend) {
  app.get('/', (req, res) => {
    res.send('FlickNest backend is running!');
  });
}

// API ROUTES
app.use('/api/movies', require('./routes/movies'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));
app.use('/api/admin/movies', require('./routes/adminMovies'));
app.use('/api/admin/genres', require('./routes/adminGenres'));
app.use('/api/admin/cast', require('./routes/adminCast'));
app.use('/api/admin/ratings', require('./routes/adminRatings'));
app.use('/api/admin/reports', require('./routes/adminReports'));
app.use('/api/upload', require('./routes/upload'));

// SPA fallback: serve index.html for all non-API routes (must be after API routes)
if (serveFrontend) {
  app.use((req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        // Provide helpful error in development, generic in production
        if (!isProduction && err.code === 'ENOENT') {
          res.status(500).send('Application not found. Please run "npm run build" to build the frontend.');
        } else {
          res.status(500).send('Application temporarily unavailable.');
        }
      }
    });
  });
}

// Central error handler (avoid leaking stacks / internal details)
app.use((err, _req, res, _next) => {
  const status = Number(err?.statusCode || err?.status || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const message = safeStatus === 500 ? 'Internal server error' : 'Request blocked';
  if (!isProduction) {
    console.error('Unhandled error:', err);
  }
  res.status(safeStatus).json({ error: message });
});

// Start server
const PORT = process.env.PORT || 4000;
const sslKeyPath = process.env.SSL_KEY_PATH;
const sslCertPath = process.env.SSL_CERT_PATH;
if (sslKeyPath && sslCertPath) {
  const https = require('https');
  const fs = require('fs');
  const server = https.createServer(
    {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    },
    app
  );
  server.listen(PORT, () => {
    console.log(`HTTPS server running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
