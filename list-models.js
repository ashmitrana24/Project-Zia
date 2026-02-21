const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const modelList = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).listModels();
    const result = await genAI.listModels();
    console.log('Available Models:');
    result.models.forEach(m => console.log(`- ${m.name}`));
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
