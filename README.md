# Tradelog

<div align="center">
  <img src="./front/img/Patrick’s Neon Trading Night.png" alt="TradeLog Logo" width="300"/>
  <h1>TradeLog - Smart Trading Journal</h1>
  <p>Your ultimate companion for tracking, analyzing, and improving your trades.</p>
</div>

<hr />

## 🚀 Features
- **Voice Journal**: Skip the boring manual data entry! Just speak your thoughts out loud (like talking to yourself) while opening a position on the chart, and AI will automatically extract and record the entire trade details for you.
- **Detailed Analytics**: Track your win rate, PnL, and balance effortlessly.
- **Customizable Checklist**: Ensure you never miss a step before entering a trade.

## 🛠 Tech Stack
- **Frontend**: JavaScript, HTML, CSS (Hosted on GitHub Pages)
- **Backend**: Node.js, Express (Hosted on Render)
- **Database**: PostgreSQL
- **AI Integration**: Whisper.cpp & LLM for Voice extraction

## ⚙️ Configuration & Setup

To run this project on your own, you need to configure a few environment variables and API endpoints.

### 1. Backend API (Frontend)
If you deploy the backend on a different server (e.g., your own Render instance), you must update the API URL in the frontend JavaScript file:
- **File:** `front/js/journal.js`
- **Find:** `const API_URL = "https://yourapi.com/api/trades";`
- **Change to:** Your own backend URL.

### 2. Voice Journal (AI & Telegram Bot)
The Voice Journal bot requires your own API keys and bot tokens. We have provided a `config.example.go` file for reference.
- **File to edit:** `Voice-Journal/internal/config/config.go`
- **What to change:**
  - `TelegramBotToken`: Get your token from [@BotFather](https://t.me/BotFather).
  - `AIAPIKey` & `AIBaseURL`: Your AI provider's API key and endpoint (e.g., OpenAI, DeepSeek).
  - `BaseDir`: Change this to the absolute path of the `voice-journal` folder on your machine.
  - `WhisperModel` & `WhisperLang`: Set your Whisper model path and language code.

### 3. Language Model (Whisper)
Currently, the default model is configured for **Persian (Farsi)** voice inputs. 
- If you want to use **English** or any other language, you need to modify the model configuration in:
  - **File:** `Voice-Journal/internal/config/config.go`
  - Change the model name or language code to your desired language (e.g., `en` for English).
- If you want to use **Whisper.cpp** locally instead of an external API, ensure the `whisper.cpp` folder is properly compiled and the model path in `config.go` is pointing to your local `.bin` model file.

## 📸 Screenshots

<div align="center">
  <img src="./front/img/screen-2.jpg" alt="TradeLog Dashboard" width="600"/>
  <p><i>The main dashboard showing trade history and analytics</i></p>
  
  <br />
  
  <img src="./front/img/screen-1.jpg" alt="Voice Journal Terminal" width="600"/>
  <p><i>Voice Journal AI extracting JSON from a Telegram voice message</i></p>
</div>

## 🎥 Video Demo

[TradeLog Demo](https://youtu.be/5PrTyw7Uw3U?si=SqtbzWM6Mi8QhrnH)

## 🌍 Vision & Roadmap

TradeLog is currently a powerful web app, but my vision is much bigger. I want to turn it into a blazing-fast, cross-platform application.

**My next goals are:**
- 🤖 **Image Analyzer**: AI-powered chart screenshot analysis.
- 📱 **Voice-to-JSON Review UI**: A sleek, swipe-friendly interface to review and approve AI-extracted trade data before saving to the database (Human-in-the-loop confirmation).
- 🚀 **Cross-Platform Apps**: Port the entire app to native desktop (Windows, macOS, Linux) and mobile (Android, iOS) using frameworks like Tauri or Flutter.
- ⚡ **Performance & Speed**: Optimize database queries, add caching, and make the UI buttery smooth.
- 🛠 **Advanced Trade Updates & Support**: More powerful trade editing features, plus full-time hours dedicated to fixing bugs and responding to community requests.

> **Want to support the development?** You can send crypto directly to my wallets in the [Support section](#-support-this-project), or reach out to me for corporate partnerships. Every contribution brings this vision closer to reality!


## 💰 Support This Project

If you find TradeLog useful, you can support its development by sending crypto directly to my wallet:

<img src="https://zengo.com/wp-content/uploads/USDT-BEP20-1.png" width="30"/> **USDT (BEP20):** `0xF6DA36c843bbb218422fee6f8798e2874c2baAC1`

<img src="https://assets.gemwallet.com/blockchains/tron/logo.png" width="30"/> **TRX (TRC20):** `TVxnAFuTmbXANaMvAadLipM6j78UPWT8QS`
