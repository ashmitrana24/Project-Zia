import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands and learn more about Zia.'),
  name: 'help',
  description: 'List all available commands and learn more about Zia.',
  async execute(interaction) {
    const isInteraction = interaction.isChatInputCommand?.();
    
    const helpMessage = `
**🚀 ZIA - FAANG L5 DSA ASSISTANT**
━━━━━━━━━━━━━━
I am Zia, your Senior FAANG Engineer (L5). I'm here to provide professional, optimized, and strictly constructive Data Structures & Algorithms guidance.

**Available Commands:**
• \`/ask <problem>\` - Get a senior-level breakdown of any DSA problem or concept.
• \`/run <lang> <code>\` - Execute C++, Java, or Python code.
• \`/interview\` - Start a mock interview session.
• \`/help\` - Show this manual.

**How I Communicate:**
> I prioritize intuition and trade-offs. No brute-force, no filler. 
> Expect production-ready C++ code and rigorous complexity analysis.

**Example Usage:**
\`/ask explain the sliding window technique\`
━━━━━━━━━━━━━━
*Tip: Don't ask for the "best" way. Ask for the "best" way.*
    `;

    try {
      if (isInteraction) {
        await interaction.reply(helpMessage);
      } else {
        await interaction.reply(helpMessage);
      }
    } catch (error) {
      console.error('Command Error (!help):', error);
      const errorMsg = 'Sorry, I encountered an error while trying to display the help menu.';
      if (isInteraction) {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      } else {
        await interaction.reply(errorMsg);
      }
    }
  },
};
