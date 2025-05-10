require('dotenv').config();
const TeleBot = require('telebot');
const express = require("express");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const PORT = process.env.PORT || 3000;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID) || 1231395570;

if (!TELEGRAM_BOT_TOKEN || !WEBHOOK_URL) {
    console.error("Error: TELEGRAM_BOT_TOKEN or WEBHOOK_URL is missing!");
    process.exit(1);
}

const bot = new TeleBot({
    token: TELEGRAM_BOT_TOKEN,
    webhook: {
        url: WEBHOOK_URL,
        port: PORT
    }
});

let videos = [];  // Videolar ro'yxati
let videoCodes = {};  // Kod va video mappingi
let adminAction = {};  // Admin uchun vaqtincha xatti-harakatlar
let channels = [];  // Kanallar ro'yxati

// /start komandasi
bot.on('text', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === '/start') {
        if (chatId === ADMIN_CHAT_ID) {
            bot.sendMessage(chatId, 'Salom Admin! Video yuborasizmi yoki ko‘rasizmi? Yuborish uchun /sendvideo, ko‘rish uchun /getvideo raqamini yuboring.\n\nKanallarni boshqarish uchun /kanallar buyrug‘ini yuboring.');
        } else {
            bot.sendMessage(chatId, 'Salom! Kodni yuboring!');
        }
    }

    // Admin video yuborish bo'limi
    else if (msg.text === '/sendvideo' && chatId === ADMIN_CHAT_ID) {
        adminAction[chatId] = 'sendvideo';
        bot.sendMessage(chatId, 'Iltimos, video yuboring:');
    }

    // Admin kanallarni boshqarish bo'limi
    else if (msg.text === '/kanallar' && chatId === ADMIN_CHAT_ID) {
        let messageText = 'Majburiy kanallar:\n\n';
        channels.forEach(channel => {
            messageText += `➕ ${channel}\n`;
        });
        messageText += '\nKanal qo‘shish uchun /addchannel buyrug‘ini yuboring.';
        bot.sendMessage(chatId, messageText);
    }

    // Foydalanuvchi video kodini yuborsa
    else if (msg.text.startsWith('/getvideo') && chatId !== ADMIN_CHAT_ID) {
        const videoNumber = parseInt(msg.text.split(' ')[1]);
        if (!isNaN(videoNumber) && videoNumber > 0 && videoNumber <= videos.length) {
            bot.sendVideo(chatId, videos[videoNumber - 1]);
        } else {
            bot.sendMessage(chatId, 'Bunday kodli video mavjud emas!');
        }
    }

    // Admin video uchun kod yuborish
    else if (adminAction[chatId] === 'sendvideo') {
        const videoId = msg.video.file_id;
        videos.push(videoId);
        bot.sendMessage(chatId, `Video raqamlandi: Video ${videos.length}`);
        bot.sendMessage(chatId, 'Endi video uchun kod yuboring:');
        adminAction[chatId] = 'sendcode';
    }

    // Admin video kodi yuborish
    else if (adminAction[chatId] === 'sendcode') {
        const videoCode = msg.text.trim();
        videoCodes[videoCode] = videos[videos.length - 1]; // So'nggi videoni kodga moslashtirish
        bot.sendMessage(chatId, `Kod muvaffaqiyatli saqlandi: ${videoCode}`);
        delete adminAction[chatId];
    }
});

// Kanal qo'shish
bot.on('text', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === '/addchannel' && chatId === ADMIN_CHAT_ID) {
        bot.sendMessage(chatId, 'Kanal @username yoki linkini yuboring:');
        adminAction[chatId] = 'addchannel';
    }

    // Admin kanal qo'shish
    else if (adminAction[chatId] === 'addchannel') {
        const newChannel = msg.text.trim();
        channels.push(newChannel);
        bot.sendMessage(chatId, 'Kanal qo‘shildi.');
        delete adminAction[chatId];
    }
});

const app = express();
app.use(express.json());
app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.receiveUpdates(req.body);
    res.sendStatus(200);
});

app.get("/", (req, res) => {
    res.send("Bot is running...");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

bot.start();
