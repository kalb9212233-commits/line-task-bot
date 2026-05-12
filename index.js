const express = require('express');
const line = require('@line/bot-sdk');

const app = express();
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_TOKEN
});
const userHistory = {};

app.post('/webhook', line.middleware({ channelSecret: process.env.LINE_SECRET }), async (req, res) => {
  res.json({ status: 'ok' });
  for (const event of req.body.events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;
    const uid = event.source.userId;
    const text = event.message.text;
    if (!userHistory[uid]) userHistory[uid] = [];
    userHistory[uid].push({ role: 'user', parts: [{ text }] });
    if (userHistory[uid].length > 20) userHistory[uid] = userHistory[uid].slice(-20);

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: '你是一個親切的繁體中文個人任務管理助理。幫使用者管理待辦事項，回覆簡短清楚，使用條列式或表情符號讓訊息易讀。' }] },
        contents: userHistory[uid]
      })
    });
    const data = await r.json();
    const reply = data.candidates[0].content.parts[0].text;
    userHistory[uid].push({ role: 'model', parts: [{ text: reply }] });
    await client.replyMessage({ replyToken: event.replyToken, messages: [{ type: 'text', text: reply }] });
  }
});

app.listen(3000, () => console.log('Bot running!'));
