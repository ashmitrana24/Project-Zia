import { EmbedBuilder } from 'discord.js';
import { generateDSAProblem, generateHint, evaluateSolution } from '../utils/gemini.js';

const sessions = new Map();

export default {
  name: 'interview',
  description: 'DSA Interview system',
  async execute(message, args) {
    const subCommand = args[0]?.toLowerCase();

    if (!subCommand) {
      return message.reply('Usage: `!interview start`, `!interview hint`, `!interview answer <code>`, or `!interview end`');
    }

    try {
      switch (subCommand) {
        case 'start':
          await handleStart(message);
          break;
        case 'hint':
          await handleHint(message);
          break;
        case 'answer':
          await handleAnswer(message, args.slice(1).join(' '));
          break;
        case 'end':
          await handleEnd(message);
          break;
        default:
          message.reply('Invalid sub-command. Use `start`, `hint`, `answer`, or `end`.');
      }
    } catch (error) {
      console.error('Interview Command Error:', error);
      message.reply('Sorry, I encountered an error. Please try again.');
    }
  },
};

async function handleStart(message) {
  if (sessions.has(message.author.id)) {
    return message.reply('⚠️ You already have an active interview session! Use `!interview end` to stop it.');
  }

  await message.channel.sendTyping();
  message.reply('🚀 Generating your DSA problem... Get ready.');

  const problemFull = await generateDSAProblem();
  
  // Parse problem sections for Embed
  const sections = parseProblem(problemFull);
  
  const session = {
    problemFull,
    problemUser: sections,
    hintsUsed: 0,
    attempts: 0,
    startTime: Date.now(),
  };

  sessions.set(message.author.id, session);

  const embed = new EmbedBuilder()
    .setTitle(`🧠 DSA Interview: ${sections.title || 'Coding Challenge'}`)
    .setColor(0x0099FF) // Blue
    .addFields(
      { name: 'Difficulty', value: sections.difficulty || 'Unknown', inline: true },
      { name: 'Problem Statement', value: sections.statement || 'No description provided.' },
      { name: 'Constraints', value: sections.constraints || 'Standard competitive programming limits.' },
      { name: 'Sample I/O', value: `\`\`\`\n${sections.sampleIO || 'N/A'}\n\`\`\`` }
    )
    .setFooter({ text: 'Use !interview answer <code> to submit your solution.' });

  await message.channel.send({ embeds: [embed] });
}

async function handleHint(message) {
  const session = sessions.get(message.author.id);
  if (!session) {
    return message.reply('❌ No active session. Start one with `!interview start`.');
  }

  await message.channel.sendTyping();
  session.hintsUsed++;
  
  const hintText = await generateHint(session.problemFull, session.hintsUsed);
  const hintMatch = hintText.match(/🚀 HINT:\s*([\s\S]+)/);
  const hint = hintMatch ? hintMatch[1].trim() : hintText;

  const embed = new EmbedBuilder()
    .setTitle('💡 Interview Hint')
    .setColor(0xFFBF00) // Amber
    .setDescription(hint)
    .setFooter({ text: `Hints used: ${session.hintsUsed}` });

  await message.channel.send({ embeds: [embed] });
}

async function handleAnswer(message, code) {
  const session = sessions.get(message.author.id);
  if (!session) {
    return message.reply('❌ No active session. Start one with `!interview start`.');
  }

  if (!code) {
    return message.reply('Please provide your code solution. Usage: `!interview answer <code>`');
  }

  // Remove code block markers if present
  const cleanedCode = code.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

  await message.channel.sendTyping();
  session.attempts++;

  const feedback = await evaluateSolution(session.problemFull, cleanedCode);
  
  // Parse feedback for fields
  const feedbackFields = parseFeedback(feedback);
  const isPass = feedback.toLowerCase().includes('final verdict: pass') || (feedbackFields.verdict && feedbackFields.verdict.toLowerCase().includes('pass'));

  const embed = new EmbedBuilder()
    .setTitle('🧠 Interview Feedback')
    .setColor(isPass ? 0x00FF00 : 0xFF0000) // Green if pass, Red if not
    .addFields(
      { name: 'Correctness', value: feedbackFields.correctness || 'See below' },
      { name: 'Complexity', value: `Time: ${feedbackFields.time || 'N/A'}\nSpace: ${feedbackFields.space || 'N/A'}` },
      { name: 'Edge Cases', value: feedbackFields.edgeCases || 'N/A' },
      { name: 'Optimization', value: feedbackFields.optimization || 'N/A' },
      { name: 'Final Verdict', value: feedbackFields.verdict || 'N/A' }
    );

  // If there's extra info not captured in fields, put it in description
  if (!feedbackFields.correctness) {
    embed.setDescription(feedback.length > 4000 ? feedback.substring(0, 3997) + '...' : feedback);
  }

  await message.channel.send({ embeds: [embed] });
}

function parseFeedback(text) {
  const fields = {};
  const correctness = text.match(/🚀 HEADER: Correctness\s*([\s\S]*?)(?=🚀|$)/i);
  const time = text.match(/🚀 HEADER: Time Complexity\s*([\s\S]*?)(?=🚀|$)/i);
  const space = text.match(/🚀 HEADER: Space Complexity\s*([\s\S]*?)(?=🚀|$)/i);
  const edge = text.match(/🚀 HEADER: Edge Cases\s*([\s\S]*?)(?=🚀|$)/i);
  const opt = text.match(/🚀 HEADER: Optimization Suggestions\s*([\s\S]*?)(?=🚀|$)/i);
  const verdict = text.match(/🚀 HEADER: Final Verdict\s*([\s\S]*?)(?=🚀|$)/i);

  if (correctness) fields.correctness = correctness[1].trim();
  if (time) fields.time = time[1].trim();
  if (space) fields.space = space[1].trim();
  if (edge) fields.edgeCases = edge[1].trim();
  if (opt) fields.optimization = opt[1].trim();
  if (verdict) fields.verdict = verdict[1].trim();

  return fields;
}

async function handleEnd(message) {
  const session = sessions.get(message.author.id);
  if (!session) {
    return message.reply('❌ You don\'t have an active interview session.');
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

  sessions.delete(message.author.id);
  await message.channel.send({ embeds: [embed] });
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
