const TeleBot = require('telebot');

// Bot tokenini o'zgartiring
const TELEGRAM_BOT_TOKEN = '7622626993:AAGr43MFdQNrI8ezKoZqyP56hw4Zfz4jkqY';
const bot = new TeleBot(TELEGRAM_BOT_TOKEN);

// Adminning chat ID sini kiritish
const adminChatId = 1231395570; // Adminning chat ID sini bu yerga qo'ying

let videos = [];
let videoMessages = {};
let adminAction = {}; // Adminning qaysi amaldan foydalanishini aniqlash

// Botni ishga tushurish
bot.on('text', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === '/start') {
    // Adminni aniqlash va savol berish
    if (chatId === adminChatId) {
      bot.sendMessage(chatId, 'Salom Admin! Video yuborasizmi yoki ko\'rasizmi? Yuborish uchun /sendvideo, ko\'rish uchun /getvideo raqamini yuboring.');
    } else {
      bot.sendMessage(chatId, 'Salom! Kodni yuboring!');
    }
  }
  else if (msg.text === '/sendvideo' && chatId === adminChatId) {
    // Admin video yuborishni tanladi
    adminAction[chatId] = 'sendvideo';
    bot.sendMessage(chatId, 'Iltimos, video yuboring:');
  }
  else if (msg.text.startsWith('/getvideo') && chatId !== adminChatId) {
    // Foydalanuvchi video olish uchun raqam yuboradi
    const videoNumber = parseInt(msg.text.split(' ')[1]);
    if (videoNumber > 0 && videoNumber <= videos.length) {
      const videoId = videos[videoNumber - 1];
      bot.sendVideo(chatId, videoId);
    } else {
      bot.sendMessage(chatId, 'Bunday kodli video mavjud emas!');
    }
  }
  else if (msg.text.match(/^\d+$/)) {
    // Foydalanuvchi faqat raqam yuborishi kerak
    const videoNumber = parseInt(msg.text);
    if (videoNumber > 0 && videoNumber <= videos.length) {
      const videoId = videos[videoNumber - 1];
      bot.sendVideo(chatId, videoId);
    } else {
      bot.sendMessage(chatId, 'Bunday kodli video mavjud emas!');
    }
  }
});

// Admin video yuborsa
bot.on('video', (msg) => {
  const chatId = msg.chat.id;

  if (chatId === adminChatId && adminAction[chatId] === 'sendvideo') {
    const videoId = msg.video.file_id;
    videos.push(videoId);
    videoMessages[videoId] = `Video ${videos.length}`;
    bot.sendMessage(chatId, `Video raqamlandi: Video ${videos.length}`);
    delete adminAction[chatId]; // Admin amali tugadi
  } else if (chatId !== adminChatId) {
    bot.sendMessage(chatId, 'Siz admin emassiz, video yubora olmaysiz!');
  }
});
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bot is running...");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Botni ishga tushurish
bot.start();