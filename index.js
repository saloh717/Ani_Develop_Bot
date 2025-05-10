require('dotenv').config();
const TeleBot = require('telebot');
const express = require('express');

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

let videos = [];
let videoCodes = {};  // Storing video ids against codes
let adminAction = {}; // For admin actions

// Helper function to check subscriptions
async function checkSubscriptions(chatId) {
    const channels = await loadChannels();
    for (let ch of channels) {
        try {
            const member = await bot.getChatMember(ch, chatId);
            if (member.status !== 'member' && member.status !== 'administrator' && member.status !== 'creator') {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    return true;
}

// Helper function to load channels from file or other source
async function loadChannels() {
    // Load channels list from file or database here
    return ['@example_channel_1', '@example_channel_2']; // Replace with actual channel list
}

bot.on('text', async (msg) => {
    const chatId = msg.chat.id;

    // Start command
    if (msg.text === '/start') {
        if (chatId === ADMIN_CHAT_ID) {
            bot.sendMessage(chatId, 'Salom Admin! Video yuborasizmi yoki ko‘rasizmi? Yuborish uchun /sendvideo, ko‘rish uchun /getvideo raqamini yuboring.');
        } else {
            // Check if user is subscribed to required channels
            const isSubscribed = await checkSubscriptions(chatId);
            if (!isSubscribed) {
                bot.sendMessage(chatId, '❗️Iltimos, kanalga a’zo bo‘ling va yana urinib ko‘ring.');
            } else {
                bot.sendMessage(chatId, 'Salom! Kodni yuboring!');
            }
        }
    }

    // Admin sends video
    else if (msg.text === '/sendvideo' && chatId === ADMIN_CHAT_ID) {
        adminAction[chatId] = 'sendvideo';
        bot.sendMessage(chatId, 'Iltimos, video yuboring:');
    }

    // User requests a video by code
    else if (msg.text.startsWith('/getvideo') && chatId !== ADMIN_CHAT_ID) {
        const videoNumber = parseInt(msg.text.split(' ')[1]);
        if (!isNaN(videoNumber) && videoNumber > 0 && videoNumber <= videos.length) {
            bot.sendVideo(chatId, videos[videoNumber - 1]);
        } else {
            bot.sendMessage(chatId, 'Bunday kodli video mavjud emas!');
        }
    }
});

// Admin sends video
bot.on('video', async (msg) => {
    const chatId = msg.chat.id;

    if (chatId === ADMIN_CHAT_ID && adminAction[chatId] === 'sendvideo') {
        const videoId = msg.video.file_id;
        videos.push(videoId);
        bot.sendMessage(chatId, `Video raqamlandi: Video ${videos.length}`);
        bot.sendMessage(chatId, 'Iltimos, video uchun kod yuboring:');
        adminAction[chatId] = 'waiting_for_code'; // waiting for code after video
    } else {
        bot.sendMessage(chatId, 'Siz admin emassiz, video yubora olmaysiz!');
    }
});

// Admin sends code after video
bot.on('text', (msg) => {
    const chatId = msg.chat.id;

    if (chatId === ADMIN_CHAT_ID && adminAction[chatId] === 'waiting_for_code') {
        const code = msg.text.trim();
        videoCodes[code] = videos[videos.length - 1];
        bot.sendMessage(chatId, `Kod saqlandi: ${code}`);
        adminAction[chatId] = null; // Reset action
    }
});

// User requests video by code
bot.on('text', async (msg) => {
    const chatId = msg.chat.id;

    if (chatId !== ADMIN_CHAT_ID) {
        const code = msg.text.trim();
        if (videoCodes[code]) {
            bot.sendVideo(chatId, videoCodes[code]);
        } else {
            bot.sendMessage(chatId, 'Bunday kod topilmadi!');
        }
    }
});

// Webhook server setup
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
