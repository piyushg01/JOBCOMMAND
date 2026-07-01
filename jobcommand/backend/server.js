const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database verification (triggers initialization)
const db = require('./db/database');

// Import routes
const applicationsRouter = require('./routes/applications');
const { router: aiRouter } = require('./routes/ai');
const dashboardRouter = require('./routes/dashboard');

// Mount routes
app.use('/api/applications', applicationsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route handler for 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
