const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN; // Токен будет браться из настроек Deplexo
const PREFIX = '+';

const ECONOMY_FILE = path.join(__dirname, 'economy.json');
const LINKS_FILE = path.join(__dirname, 'links.json');

let economy = {};
let links = {};

try {
    if (fs.existsSync(ECONOMY_FILE)) economy = JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8'));
    if (fs.existsSync(LINKS_FILE)) links = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
} catch (error) {
    console.error('Ошибка при загрузке данных:', error);
}

const saveEconomy = () => fs.writeFileSync(ECONOMY_FILE, JSON.stringify(economy, null, 2));
const saveLinks = () => fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const getEconomy = (userId) => {
    if (!economy[userId]) economy[userId] = { balance: 0, lastWork: 0 };
    return economy[userId];
};

const formatMoney = (amount) => `${amount.toLocaleString('ru-RU')} монет`;

client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} готов к работе!`);
    client.user.setActivity('за сервером | +help', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📋 Список команд')
            .addFields(
                { name: 'ℹ️ Инфо', value: '`+server`' },
                { name: '💰 Экономика', value: '`+bal` `+work`' },
                { name: '🔗 Привязка', value: '`+link`' },
            );
        return message.reply({ embeds: [embed] });
    }

    if (command === 'server') {
        return message.reply(`Сервер: **${message.guild.name}** | Участников: **${message.guild.memberCount}**`);
    }

    if (command === 'work') {
        const userData = getEconomy(message.author.id);
        const now = Date.now();
        if (now - userData.lastWork < 15 * 60 * 1000) return message.reply('⏳ Отдохните еще немного!');
        
        const earned = Math.floor(Math.random() * 50) + 10;
        userData.balance += earned;
        userData.lastWork = now;
        saveEconomy();
        return message.reply(`💼 Вы заработали **${formatMoney(earned)}**!`);
    }

    if (command === 'bal') {
        const target = message.mentions.users.first() || message.author;
        return message.reply(`💰 Баланс **${target.username}**: ${formatMoney(getEconomy(target.id).balance)}`);
    }

    if (command === 'link') {
        const nick = args.join(' ');
        if (!nick) return message.reply('❌ Напишите ваш игровой ник: `+link Ваш_Ник`');
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        links[message.author.id] = { gameNickname: nick, authCode: code };
        saveLinks();
        return message.reply(`✅ Ник **${nick}** привязан! Ваш код: ||**${code}**||`);
    }
});

client.login(TOKEN);
