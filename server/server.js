import cors from 'cors';
import express from 'express';
import { getAIResponse } from './ai_api.js';
import { getCustomerInfo } from './database_api.js';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/support', async (req, res) => {
  const { email, message } = req.body;

  const customerInfo = await getCustomerInfo(email);
  const response = await getAIResponse(customerInfo, message);

  res.json({ response });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
