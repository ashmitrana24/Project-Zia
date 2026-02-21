import { generateResponse } from '../utils/gemini.js';

export default {
  name: 'ask',
  description: 'Ask a DSA question to the FAANG Engineer bot',
  async execute(message, args) {
    const query = args.join(' ');

    if (!query) {
      return message.reply('Please provide a query or a DSA problem to explain. Usage: `!ask <problem>`');
    }

    try {
      await message.channel.sendTyping();
      const responseText = await generateResponse(query);

      if (responseText.length <= 2000) {
        await message.reply(responseText);
      } else {
        const chunks = splitMessage(responseText, 1900);
        for (const chunk of chunks) {
          await message.channel.send(chunk);
        }
      }
    } catch (error) {
      console.error('Command Error (!ask):', error);
      message.reply('Sorry, I encountered an error while processing your request. Please try again later.');
    }
  },
};

function splitMessage(text, maxLength) {
  const chunks = [];
  let currentPos = 0;

  while (currentPos < text.length) {
    let endPos = currentPos + maxLength;
    if (endPos < text.length) {
      const lastNewLine = text.lastIndexOf('\n', endPos);
      if (lastNewLine > currentPos) {
        endPos = lastNewLine;
      }
    }
    chunks.push(text.substring(currentPos, endPos).trim());
    currentPos = endPos;
  }
  return chunks;
}
