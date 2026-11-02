const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// သတ်မှတ်ထားသော Frontend Origin ကိုသာ ခွင့်ပြုရန်
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite Frontend ရဲ့ URL ကိုသာ ခွင့်ပြုမည်
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // လိုအပ်သော HTTP Methods များကိုသာ ခွင့်ပြုနိုင်သည်
  allowedHeaders: ['Content-Type', 'Authorization'], // JWT အတွက် Authorization header ကိုခွင့်ပြုသည်
  optionsSuccessStatus: 200
};

// CORS Options ကို အသုံးပြုခြင်း
app.use(cors(corsOptions));

// JSON body ဖတ်၍ ရန် (login စသည်အတွက် လိုအပ်သည်)
app.use(express.json());

// အခြေခံ API
app.get('/reqapi', (req, res) => {
  res.json({ message: "Hello! This data came from the Express backend securely." });
});

// JWT Authentication routes → /api/auth/...
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
