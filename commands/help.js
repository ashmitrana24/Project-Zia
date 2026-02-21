export default {
  name: 'help',
  description: 'List all available commands and learn more about Zia.',
  async execute(message, args) {
    const helpMessage = `
**🚀 ZIA - FAANG L5 DSA ASSISTANT**
━━━━━━━━━━━━━━
I am Zia, your Senior FAANG Engineer (L5). I'm here to provide professional, optimized, and strictly constructive Data Structures & Algorithms guidance.

**Available Commands:**
• \`!ask <problem>\` - Get a senior-level breakdown of any DSA problem or concept.
• \`!help\` - Show this manual.

**How I Communicate:**
> I prioritize intuition and trade-offs. No brute-force, no filler. 
> Expect production-ready C++ code and rigorous complexity analysis.

**Example Usage:**
\`!ask explain the sliding window technique\`
━━━━━━━━━━━━━━
*Tip: Don't ask for the "easiest" way. Ask for the "best" way.*
    `;

    try {
      await message.reply(helpMessage);
    } catch (error) {
      console.error('Command Error (!help):', error);
      message.reply('Sorry, I encountered an error while trying to display the help menu.');
    }
  },
};
