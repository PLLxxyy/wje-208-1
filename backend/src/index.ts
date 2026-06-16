import express from 'express';
import cors from 'cors';
import routes from './routes';
import { getDb } from './db';

const app = express();
const PORT = Number(process.env.PORT) || 3208;

// Initialize database
getDb();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
