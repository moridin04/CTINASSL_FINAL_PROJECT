# FlickNest - Movie Streaming Platform

A full-stack movie streaming application with React frontend and Express backend.

## Features

- Movie browsing and streaming
- User authentication and authorization
- Admin dashboard for content management
- Secure API with comprehensive security headers
- Production-ready deployment configuration

## Security Features

This application implements comprehensive security measures including:

- **Helmet Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy
- **CORS Protection**: Restrictive origin allowlist
- **Rate Limiting**: Protection against brute force and abuse
- **Input Sanitization**: MongoDB injection and HPP protection
- **HTTPS Support**: Optional TLS/SSL configuration
- **Secure Cookies**: HttpOnly, SameSite cookies for sessions

## Architecture

### Development Mode (Two Servers)
- Frontend: React dev server on port 3000
- Backend: Express API server on port 4000
- Frontend proxies API requests to backend

### Production Mode (Single Server)
- Express serves both frontend static files and API
- All requests handled by single server on configured port
- Security headers apply to all routes including static assets

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or remote connection)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CTINASSL_FINAL_PROJECT-main
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```
   This will install dependencies for both frontend and backend.

3. **Configure environment variables**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Key environment variables:
   - `NODE_ENV`: Set to `production` for production mode
   - `SERVE_FRONTEND`: Set to `true` to serve frontend from Express
   - `CORS_ORIGINS`: Comma-separated list of allowed origins
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret for JWT tokens
   - `ENFORCE_HTTPS`: Set to `true` to redirect HTTP to HTTPS

## Running the Application

### Development Mode (Recommended for Development)

Run frontend and backend separately with hot-reload:

```bash
npm run dev
```

This starts:
- Frontend at http://localhost:3000
- Backend at http://localhost:4000

Or run them separately:
```bash
npm run frontend  # Frontend only
npm run backend   # Backend only
```

### Production Mode

Build and run as a single server:

1. **Build the frontend**
   ```bash
   npm run build:prod
   ```

2. **Start the production server**
   ```bash
   npm run start:prod
   ```

   Or manually:
   ```bash
   cd server
   NODE_ENV=production npm start
   ```

The server will serve both the API and frontend on the configured PORT (default: 4000).

Access the application at: http://localhost:4000

### Production Mode with HTTPS

1. Generate or obtain SSL certificates
2. Configure environment variables:
   ```env
   SSL_KEY_PATH=/path/to/private-key.pem
   SSL_CERT_PATH=/path/to/certificate.pem
   NODE_ENV=production
   ENFORCE_HTTPS=true
   ```
3. Start the server:
   ```bash
   npm run start:prod
   ```

## Environment Variables Reference

### Server Configuration
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment mode (development/production)
- `SERVE_FRONTEND`: Explicitly enable frontend serving (auto-enabled in production)
- `MONGO_URI`: MongoDB connection string

### Security
- `JWT_SECRET`: Secret for access tokens (required)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (required)
- `BCRYPT_COST`: Password hashing rounds (default: 12)
- `CORS_ORIGINS`: Comma-separated allowlist of origins. In development defaults to `http://localhost:3000`. In production CORS is disabled unless explicitly set. Use `CORS_ORIGINS=none` to force-disable in all environments.
- `ENFORCE_HTTPS`: Redirect HTTP to HTTPS. Defaults to enabled in production (set `ENFORCE_HTTPS=false` to disable).

### SSL/TLS
- `SSL_KEY_PATH`: Path to SSL private key
- `SSL_CERT_PATH`: Path to SSL certificate
- `HSTS_PRELOAD`: Enable HSTS preload (only if domain is submitted to https://hstspreload.org/)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS`: Time window for rate limiting (default: 15 minutes)
- `RATE_LIMIT_MAX`: Max requests per window (default: 300)

## Security Headers

When running in production mode (or with `SERVE_FRONTEND=true`), the server applies comprehensive security headers to all responses:

- **Content-Security-Policy**: Restricts resource loading to trusted sources
- **X-Frame-Options**: Prevents clickjacking attacks (DENY)
- **X-Content-Type-Options**: Prevents MIME-type sniffing (nosniff)
- **Strict-Transport-Security**: Enforces HTTPS (production only)
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features
- **X-Powered-By**: Removed to prevent information disclosure

## OWASP ZAP Security Compliance

This application addresses the following OWASP ZAP findings:

### Fixed Issues
1. ✅ Content Security Policy (CSP) Header Set
2. ✅ CSP Directives Defined with Fallbacks
3. ✅ Cross-Domain Configuration Restricted
4. ✅ HTTPS Enforcement Available
5. ✅ Anti-clickjacking Headers Present (X-Frame-Options + CSP frame-ancestors)
6. ✅ X-Powered-By Header Removed
7. ✅ X-Content-Type-Options Header Set
8. ✅ Suspicious Comments Removed from HTML

### Production Build Timestamp Disclosure
The production build process may include timestamps in bundled JavaScript files. This is a standard build artifact and does not pose a significant security risk. To minimize exposure:
- Always scan the production build served by Express (not the dev server)
- Use minification and obfuscation in production builds (enabled by default with `npm run build`)

To reduce information disclosure findings (e.g. source map references and build comments), use the production build script:
- `npm run build:prod` (disables source maps via `GENERATE_SOURCEMAP=false`)

## Deployment Recommendations

### For Production Deployment:

1. **Use Environment Variables**: Never commit secrets to version control
2. **Enable HTTPS**: Use SSL certificates and set `ENFORCE_HTTPS=true`
3. **Restrict CORS**: Set `CORS_ORIGINS` to only allowed domains
4. **Use Strong Secrets**: Generate cryptographically secure JWT secrets
5. **Configure Rate Limiting**: Adjust based on expected traffic
6. **Enable HSTS**: Automatic when `NODE_ENV=production`
7. **Use Reverse Proxy**: Consider Nginx or cloud load balancer for additional security
8. **Monitor Logs**: Implement logging and monitoring
9. **Keep Dependencies Updated**: Regular security updates

### Deployment Platforms

The application can be deployed to:
- **Heroku**: Set environment variables in dashboard, automatic HTTPS
- **AWS/GCP/Azure**: Use container services or VM with Nginx
- **Render**: Native support for Node.js apps with automatic HTTPS
- **DigitalOcean**: App Platform or Droplet with Nginx

## Testing

Run frontend tests:
```bash
cd flicknest-frontend
npm test
```

## Project Structure

```
CTINASSL_FINAL_PROJECT-main/
├── server/                 # Express backend
│   ├── index.js           # Main server file
│   ├── routes/            # API routes
│   ├── models/            # Mongoose models
│   ├── middleware/        # Custom middleware
│   └── public/            # Static assets
├── flicknest-frontend/    # React frontend
│   ├── src/               # React components
│   ├── public/            # Public assets
│   └── build/             # Production build (generated)
├── package.json           # Root package configuration
└── README.md              # This file
```

## Troubleshooting

### Port Already in Use
If you get a port conflict error:
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
# Or change PORT in .env
```

### MongoDB Connection Failed
Ensure MongoDB is running:
```bash
# Start MongoDB locally
mongod --dbpath /path/to/data/directory
# Or use a remote MongoDB connection string
```

### Production Build Not Found
If you get errors about missing build directory:
```bash
# Build the frontend first
npm run build
```

### CORS Errors in Production
Ensure `CORS_ORIGINS` includes your frontend domain:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue in the repository.
