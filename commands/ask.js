import { SlashCommandBuilder } from 'discord.js';
import { generateResponse } from '../utils/gemini.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask a DSA question to the FAANG Engineer bot')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The DSA problem or question to explain')
        .setRequired(true)),
  name: 'ask',
  description: 'Ask a DSA question to the FAANG Engineer bot',
  async execute(interaction, args) {
    // Handle both slash command and prefix command
    let query;
    let isInteraction = false;

    if (interaction.isChatInputCommand?.()) {
      query = interaction.options.getString('question');
      isInteraction = true;
    } else {
      query = args.join(' ');
    }

    if (!query) {
      const msg = 'Please provide a query or a DSA problem to explain. Usage: `!ask <problem>` or use `/ask`';
      return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
    }

    try {
      if (isInteraction) {
        await interaction.deferReply();
      } else {
        await interaction.channel.sendTyping();
      }

      const responseText = await generateResponse(query);

      if (responseText.length <= 2000) {
        if (isInteraction) {
          await interaction.editReply(responseText);
        } else {
          await interaction.reply(responseText);
        }
      } else {
        const chunks = splitMessage(responseText, 1900);
        for (let i = 0; i < chunks.length; i++) {
          if (isInteraction && i === 0) {
            await interaction.editReply(chunks[i]);
          } else {
            await interaction.channel.send(chunks[i]);
          }
        }
      }
    } catch (error) {
      console.error('Command Error (!ask):', error);
      const errorMsg = 'Sorry, I encountered an error while processing your request. Please try again later.';
      if (isInteraction) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(errorMsg);
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
      } else {
        interaction.reply(errorMsg);
      }
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
