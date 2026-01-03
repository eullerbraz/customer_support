import cors from 'cors';
import express from 'express';
import { getAIResponse } from './ai_api.js';
import { getCustomerInfo } from './database_api.js';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const chatHistory = {};

app.post('/support', async (req, res) => {
  const { email, message } = req.body;

  if (!(email in chatHistory)) {
    chatHistory[email] = [];
  }

  chatHistory[email].push({
    role: 'user',
    parts: [{ text: message }],
  });

  const customerInfo = await getCustomerInfo(email);

  const response = await getAIResponse(customerInfo, chatHistory[email]);

  chatHistory[email].push({
    role: 'model',
    parts: [{ text: response }],
  });

  res.json({ response });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
