import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { generateDSAProblem, generateHint, evaluateSolution } from '../utils/gemini.js';

const sessions = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('interview')
    .setDescription('DSA Interview system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Start a new mock interview session'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('hint')
        .setDescription('Get a hint for the current problem'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('answer')
        .setDescription('Submit your solution code')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('Your solution code')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('end')
        .setDescription('End the current interview session')),
  name: 'interview',
  description: 'DSA Interview system',
  async execute(interaction, args) {
    const isInteraction = interaction.isChatInputCommand?.();
    const subCommand = isInteraction ? interaction.options.getSubcommand() : args[0]?.toLowerCase();

    if (!subCommand) {
      const msg = 'Usage: `!interview start`, `!interview hint`, `!interview answer <code>`, or `!interview end`';
      return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
    }

    try {
      switch (subCommand) {
        case 'start':
          await handleStart(interaction);
          break;
        case 'hint':
          await handleHint(interaction);
          break;
        case 'answer':
          const code = isInteraction ? interaction.options.getString('code') : args.slice(1).join(' ');
          await handleAnswer(interaction, code);
          break;
        case 'end':
          await handleEnd(interaction);
          break;
        default:
          const msg = 'Invalid sub-command. Use `start`, `hint`, `answer`, or `end`.';
          if (isInteraction) {
            await interaction.reply({ content: msg, ephemeral: true });
          } else {
            await interaction.reply(msg);
          }
      }
    } catch (error) {
      console.error('Interview Command Error:', error);
      const errorMsg = 'Sorry, I encountered an error. Please try again.';
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

async function handleStart(interaction) {
  const isInteraction = interaction.isChatInputCommand?.();
  const userId = isInteraction ? interaction.user.id : interaction.author.id;
  const channel = interaction.channel;

  if (sessions.has(userId)) {
    const msg = '⚠️ You already have an active interview session! Use `!interview end` or `/interview end` to stop it.';
    return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
  }

  if (isInteraction) {
    await interaction.deferReply();
  } else {
    await channel.sendTyping();
    await interaction.reply('🚀 Generating your DSA problem... Get ready.');
  }

  const problemFull = await generateDSAProblem();
  const sections = parseProblem(problemFull);
  
  const session = {
    problemFull,
    problemUser: sections,
    hintsUsed: 0,
    attempts: 0,
    startTime: Date.now(),
  };

  sessions.set(userId, session);

  const embed = new EmbedBuilder()
    .setTitle(`🧠 DSA Interview: ${sections.title || 'Coding Challenge'}`)
    .setColor(0x0099FF) // Blue
    .addFields(
      { name: 'Difficulty', value: sections.difficulty || 'Unknown', inline: true },
      { name: 'Problem Statement', value: sections.statement || 'No description provided.' },
      { name: 'Constraints', value: sections.constraints || 'Standard competitive programming limits.' },
      { name: 'Sample I/O', value: `\`\`\`\n${sections.sampleIO || 'N/A'}\n\`\`\`` }
    )
    .setFooter({ text: 'Use /interview answer or !interview answer <code> to submit your solution.' });

  if (isInteraction) {
    await interaction.editReply({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

async function handleHint(interaction) {
  const isInteraction = interaction.isChatInputCommand?.();
  const userId = isInteraction ? interaction.user.id : interaction.author.id;
  const session = sessions.get(userId);

  if (!session) {
    const msg = '❌ No active session. Start one with `!interview start` or `/interview start`.';
    return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
  }

  if (isInteraction) {
    await interaction.deferReply();
  } else {
    await interaction.channel.sendTyping();
  }

  session.hintsUsed++;
  
  const hintText = await generateHint(session.problemFull, session.hintsUsed);
  const hintMatch = hintText.match(/🚀 HINT:\s*([\s\S]+)/);
  const hint = hintMatch ? hintMatch[1].trim() : hintText;

  const embed = new EmbedBuilder()
    .setTitle('💡 Interview Hint')
    .setColor(0xFFBF00) // Amber
    .setDescription(hint)
    .setFooter({ text: `Hints used: ${session.hintsUsed}` });

  if (isInteraction) {
    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.channel.send({ embeds: [embed] });
  }
}

async function handleAnswer(interaction, code) {
  const isInteraction = interaction.isChatInputCommand?.();
  const userId = isInteraction ? interaction.user.id : interaction.author.id;
  const session = sessions.get(userId);

  if (!session) {
    const msg = '❌ No active session. Start one with `!interview start` or `/interview start`.';
    return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
  }

  if (!code) {
    const msg = 'Please provide your code solution. Usage: `!interview answer <code>` or use the code option in `/interview answer`.';
    return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
  }

  // Remove code block markers if present
  const cleanedCode = code.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

  if (isInteraction) {
    await interaction.deferReply();
  } else {
    await interaction.channel.sendTyping();
  }

  session.attempts++;

  const feedback = await evaluateSolution(session.problemFull, cleanedCode);
  const feedbackFields = parseFeedback(feedback);
  const isPass = feedback.toLowerCase().includes('final verdict: pass') || (feedbackFields.verdict && feedbackFields.verdict.toLowerCase().includes('pass'));

  const embed = new EmbedBuilder()
    .setTitle('🧠 Interview Feedback')
    .setColor(isPass ? 0x00FF00 : 0xFF0000)
    .addFields(
      { name: 'Correctness', value: feedbackFields.correctness || 'See below' },
      { name: 'Complexity', value: `Time: ${feedbackFields.time || 'N/A'}\nSpace: ${feedbackFields.space || 'N/A'}` },
      { name: 'Edge Cases', value: feedbackFields.edgeCases || 'N/A' },
      { name: 'Optimization', value: feedbackFields.optimization || 'N/A' },
      { name: 'Final Verdict', value: feedbackFields.verdict || 'N/A' }
    );

  if (!feedbackFields.correctness) {
    embed.setDescription(feedback.length > 4000 ? feedback.substring(0, 3997) + '...' : feedback);
  }

  if (isInteraction) {
    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.channel.send({ embeds: [embed] });
  }
}

async function handleEnd(interaction) {
  const isInteraction = interaction.isChatInputCommand?.();
  const userId = isInteraction ? interaction.user.id : interaction.author.id;
  const session = sessions.get(userId);

  if (!session) {
    const msg = '❌ You don\'t have an active interview session.';
    return isInteraction ? interaction.reply({ content: msg, ephemeral: true }) : interaction.reply(msg);
  }

  if (isInteraction) {
    await interaction.deferReply();
  } else {
    // No typing needed for end
  }

  const duration = Math.floor((Date.now() - session.startTime) / 60000);
  
  const embed = new EmbedBuilder()
    .setTitle('🏁 Interview Session Ended')
    .setColor(0x0099FF)
    .addFields(
      { name: 'Duration', value: `${duration} minutes`, inline: true },
      { name: 'Hints Used', value: `${session.hintsUsed}`, inline: true },
      { name: 'Attempts', value: `${session.attempts}`, inline: true }
    )
    .setDescription('Great effort! Keep practicing to sharpen your skills.');

  sessions.delete(userId);
  if (isInteraction) {
    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.channel.send({ embeds: [embed] });
  }
}

function parseProblem(text) {
  const sections = {};
  const titleMatch = text.match(/🚀 TITLE:\s*(.*)/);
  const diffMatch = text.match(/🚀 DIFFICULTY:\s*(.*)/);
  const stateMatch = text.match(/🚀 STATEMENT:\s*([\s\S]*?)(?=🚀|$)/);
  const constMatch = text.match(/🚀 CONSTRAINTS:\s*([\s\S]*?)(?=🚀|$)/);
  const ioMatch = text.match(/🚀 SAMPLE I\/O:\s*([\s\S]*?)(?=🚀|$)/);

  if (titleMatch) sections.title = titleMatch[1].trim();
  if (diffMatch) sections.difficulty = diffMatch[1].trim();
  if (stateMatch) sections.statement = stateMatch[1].trim();
  if (constMatch) sections.constraints = constMatch[1].trim();
  if (ioMatch) sections.sampleIO = ioMatch[1].trim();

  return sections;
}
