/**
 * OCH! SUSHI – Express Server
 * Production-ready with security, rate limiting, and static file serving
 */
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors());

// Body parser
app.use(express.json({ limit: '10kb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.' }
});
app.use('/api', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Fallback: serve index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Wystąpił błąd serwera. Spróbuj ponownie.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🍣 OCH! SUSHI Server uruchomiony!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔑 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Skonfigurowany' : 'BRAK KLUCZA – ustaw w .env'}`);
  console.log(`📧 Email: ${process.env.SMTP_USER || 'BRAK – ustaw w .env'}\n`);
});
