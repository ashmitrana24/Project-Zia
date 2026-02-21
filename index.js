import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const cooldowns = new Collection();
const PREFIX = '!';

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Use dynamic import for ESM modules
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const fileUrl = pathToFileURL(filePath).href;
  
  // Note: import() returns a promise, but we can use top-level await or handle it in an async context
  // Here we are in top-level context, so we can use await directly in a loop or handle it asynchronously.
  // Actually, standard for-of over commandFiles is fine if we make the loader async.
}

// Wrapping in an async function to use await for dynamic imports
async function loadCommands() {
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath).href;
    const { default: command } = await import(fileUrl);
    
    if (command && 'name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        // Handle aliases
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => client.commands.set(alias, command));
        }
    } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "name" or "execute" property.`);
    }
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log('Foundation Discord Bot (Phase 1) is ready.');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);

  if (!command) return;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = 5000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before using the \`${command.name}\` command.`);
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    await command.execute(message, args, commandName);
  } catch (error) {
    console.error('Execution Error:', error);
    message.reply('There was an error trying to execute that command!');
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Initialize bot
(async () => {
    await loadCommands();
    client.login(process.env.DISCORD_TOKEN);
})();
