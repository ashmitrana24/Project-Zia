import { EmbedBuilder } from 'discord.js';
import { executeCode } from '../utils/wandbox.js';
import { isSupported } from '../utils/languages.js';
import { detectLanguage } from '../utils/detector.js';
import { explainCode } from '../utils/gemini.js';

const PREFIX = '!';

export default {
  name: 'run',
  description: 'Execute code snippets in C++, Java, or Python.',
  aliases: ['py', 'python', 'cpp', 'java'],
  async execute(message, args, commandName) {
    // 1. Initial Extraction
    let language = '';
    let code = '';

    // If using an alias (e.g., !py), set specific language
    const languageAliases = {
      'py': 'python',
      'python': 'python',
      'cpp': 'cpp',
      'java': 'java'
    };

    if (commandName in languageAliases) {
      language = languageAliases[commandName];
      // Code is everything after the command name
      code = message.content.slice(message.content.indexOf(commandName) + commandName.length).trim();
    } else {
      // Standard !run usage
      const firstArg = args[0]?.toLowerCase();
      if (firstArg && isSupported(firstArg)) {
        language = firstArg;
        code = message.content.slice(message.content.indexOf(args[0]) + args[0].length).trim();
      } else {
        // No valid language arg (e.g., !run print("hi"))
        code = message.content.slice(message.content.indexOf(commandName) + commandName.length).trim();
      }
    }

    // 2. Auto-detection from code blocks (priority)
    if (code.startsWith('```')) {
      const match = code.match(/^```([a-z0-9+#]+)/i);
      const detectedLang = match ? match[1].toLowerCase() : null;
      
      const detectionMap = {
        'python': 'python',
        'py': 'python',
        'cpp': 'cpp',
        'c++': 'cpp',
        'java': 'java'
      };

      if (detectedLang && detectionMap[detectedLang]) {
        language = detectionMap[detectedLang];
      }

      // Cleanup code block
      code = code.replace(/^```[a-z0-9+#]*\n/i, '').replace(/\n```$/i, '').trim();
    }

    // 3. Smart Detection (if language is still unknown)
    if (!language && code) {
      language = detectLanguage(code);
    }

    // 4. Language-specific Pre-processing
    if (language === 'cpp') {
      // Inject common headers if missing
      if (!code.includes('#include')) {
        code = `#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\n#include <unordered_map>\n#include <unordered_set>\n#include <queue>\n#include <stack>\n#include <map>\n#include <set>\nusing namespace std;\n\n${code}`;
      }
      // Inject dummy main if missing
      if (!code.includes('main(') && !code.includes('main  (')) {
        code += '\n\nint main() { return 0; }';
      }
    } else if (language === 'java') {
      // Remove 'public' from class declarations to avoid Wandbox filename mismatches
      code = code.replace(/public\s+class/g, 'class');
      // Inject common imports if missing
      if (!code.includes('import ')) {
        code = `import java.util.*;\nimport java.util.stream.*;\n\n${code}`;
      }
      // Inject dummy main if missing
      if (!code.includes('static void main')) {
        // Find the last class closing bracket or just append a main class
        if (code.includes('class Solution')) {
           code = code.replace(/}\s*$/, '\n    public static void main(String[] args) {}\n}');
        } else {
           code += '\nclass Main { public static void main(String[] args) {} }';
        }
      }
    } else if (language === 'python') {
      // Inject typing if missing
      if (!code.includes('import ') && !code.includes('from ')) {
        code = `from typing import *\n\n${code}`;
      }
    }

    // 5. Validation
    if (!code) {
      return message.reply(`Usage: \`${PREFIX}run <language> <code>\` or shortcuts like \`${PREFIX}py <code>\`\nExample:\n\`\`\`\n${PREFIX}py\nprint("Hello")\n\`\`\``);
    }

    if (!isSupported(language)) {
      return message.reply(`Unsupported language: \`${language}\`. Supported: \`cpp\`, \`java\`, \`python\`.`);
    }

    if (code.length > 5000) {
      return message.reply('Code is too long! Please keep it under 5000 characters.');
    }

    try {
      await message.channel.sendTyping();
      
      const result = await executeCode(language, code);

      // --- Build Result Embed ---
      const resultEmbed = new EmbedBuilder()
        .setColor('#5865F2') // Blurple
        .setTitle(`👨‍💻 Code Execution Result (${language.toUpperCase()})`)
        .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      if (result.stdout) {
        resultEmbed.addFields({ name: '📤 Output', value: `\`\`\`\n${truncate(result.stdout, 1000)}\n\`\`\`` });
      }

      if (result.stderr || result.compile_output) {
        const errorContent = result.compile_output || result.stderr;
        resultEmbed.setColor('#ED4245') // Red
          .addFields({ name: result.compile_output ? '❌ Compilation Error' : '⚠️ Runtime Error', value: `\`\`\`\n${truncate(errorContent, 1000)}\n\`\`\`` });
      }

      if (!result.stdout && !result.stderr && !result.compile_output) {
        resultEmbed.setDescription(`**Status:** ${result.status} (No output)`);
      }

      resultEmbed.setFooter({ text: `Time: ${result.time}s | Memory: ${result.memory}KB` });

      await message.reply({ embeds: [resultEmbed] });

      // --- Build AI Insight Embed ---
      try {
        await message.channel.sendTyping();
        const aiExplanation = await explainCode(language, code, result);
        
        const aiEmbed = new EmbedBuilder()
            .setColor('#EB459E') // Pink/Aesthetic
            .setTitle(`✨ Zia's Insights`)
            .setDescription(truncate(aiExplanation, 4000)) // Discord embeds allow up to 4096 in description
            .setFooter({ text: 'Powered by Gemini 3 Flash', iconURL: message.client.user.displayAvatarURL() });

        await message.reply({ embeds: [aiEmbed] });
      } catch (aiError) {
        console.error('AI Explanation failed:', aiError);
      }

    } catch (error) {
      console.error('Command Error (!run):', error);
      message.reply(`Error: ${error.message}`);
    }
  },
};

/**
 * Truncates text to a maximum length.
 */
function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}
