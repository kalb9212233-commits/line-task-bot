{\rtf1\ansi\ansicpg950\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require('express');\
const line = require('@line/bot-sdk');\
\
const app = express();\
const client = new line.messagingApi.MessagingApiClient(\{\
  channelAccessToken: process.env.LINE_TOKEN\
\});\
const userHistory = \{\};\
\
app.post('/webhook', line.middleware(\{ channelSecret: process.env.LINE_SECRET \}), async (req, res) => \{\
  res.json(\{ status: 'ok' \});\
  for (const event of req.body.events) \{\
    if (event.type !== 'message' || event.message.type !== 'text') continue;\
    const uid = event.source.userId;\
    const text = event.message.text;\
    if (!userHistory[uid]) userHistory[uid] = [];\
    userHistory[uid].push(\{ role: 'user', parts: [\{ text \}] \});\
    if (userHistory[uid].length > 20) userHistory[uid] = userHistory[uid].slice(-20);\
\
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$\{process.env.GEMINI_KEY\}`, \{\
      method: 'POST',\
      headers: \{ 'Content-Type': 'application/json' \},\
      body: JSON.stringify(\{\
        system_instruction: \{ parts: [\{ text: '\uc0\u20320 \u26159 \u19968 \u20491 \u35242 \u20999 \u30340 \u32321 \u39636 \u20013 \u25991 \u20491 \u20154 \u20219 \u21209 \u31649 \u29702 \u21161 \u29702 \u12290 \u24171 \u20351 \u29992 \u32773 \u31649 \u29702 \u24453 \u36774 \u20107 \u38917 \u65292 \u22238 \u35206 \u31777 \u30701 \u28165 \u26970 \u65292 \u20351 \u29992 \u26781 \u21015 \u24335 \u25110 \u34920 \u24773 \u31526 \u34399 \u35731 \u35338 \u24687 \u26131 \u35712 \u12290 ' \}] \},\
        contents: userHistory[uid]\
      \})\
    \});\
    const data = await r.json();\
    const reply = data.candidates[0].content.parts[0].text;\
    userHistory[uid].push(\{ role: 'model', parts: [\{ text: reply \}] \});\
    await client.replyMessage(\{ replyToken: event.replyToken, messages: [\{ type: 'text', text: reply \}] \});\
  \}\
\});\
\
app.listen(3000, () => console.log('Bot running!'));}