const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// သတ်မှတ်ထားသော Frontend Origin ကိုသာ ခွင့်ပြုရန်
const corsOptions = {
  origin: ['http://localhost:517','http://localhost:517'], // Vite Frontend ရဲ့ URL ကိုသာ ခွင့်ပြုမည်
  methods: ['GET', 'POST'],        // လိုအပ်သော HTTP Methods များကိုသာ ခွင့်ပြုနိုင်သည်
  optionsSuccessStatus: 200
};

// CORS Options ကို အသုံးပြုခြင်း
app.use(cors(corsOptions));

app.get('/reqapi', (req, res) => {
  res.json({ message: "Hello! This data came from the Express backend securely." });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});