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
require('dotenv').config();

const bot = new TeleBot({
    token: TELEGRAM_BOT_TOKEN,
    webhook: {
        url: WEBHOOK_URL,
        port: PORT
    }
});

let videos = [];
let adminAction = {}; 

bot.on('text', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === '/start') {
        if (chatId === ADMIN_CHAT_ID) {
            bot.sendMessage(chatId, 'Salom Admin! Video yuborasizmi yoki ko‘rasizmi? Yuborish uchun /sendvideo, ko‘rish uchun /getvideo raqamini yuboring.');
        } else {
            bot.sendMessage(chatId, 'Salom! Kodni yuboring!');
        }
    } 
    else if (msg.text === '/sendvideo' && chatId === ADMIN_CHAT_ID) {
        adminAction[chatId] = 'sendvideo';
        bot.sendMessage(chatId, 'Iltimos, video yuboring:');
    } 
    else if (msg.text.startsWith('/getvideo') && chatId !== ADMIN_CHAT_ID) {
        const videoNumber = parseInt(msg.text.split(' ')[1]);
        if (!isNaN(videoNumber) && videoNumber > 0 && videoNumber <= videos.length) {
            bot.sendVideo(chatId, videos[videoNumber - 1]);
        } else {
            bot.sendMessage(chatId, 'Bunday kodli video mavjud emas!');
        }
    }
});

bot.on('video', (msg) => {
    const chatId = msg.chat.id;

    if (chatId === ADMIN_CHAT_ID && adminAction[chatId] === 'sendvideo') {
        const videoId = msg.video.file_id;
        videos.push(videoId);
        bot.sendMessage(chatId, `Video raqamlandi: Video ${videos.length}`);
        delete adminAction[chatId];
    } else {
        bot.sendMessage(chatId, 'Siz admin emassiz, video yubora olmaysiz!');
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
