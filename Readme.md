
# BugBlaze

**AI-Powered Code Debugging & Analysis for Developers**

BugBlaze is a blazing-fast command-line tool that helps you **find, understand, and fix bugs** in your code—powered by AI. Whether you're a solo developer or part of a team, BugBlaze turns confusing errors into clear insights and actionable solutions.

---

## ✨ Features

### Free Tier
- ✅ **50 AI Analyses/Month** – Enough to get a taste of the magic
- ✅ **Basic Mentor Mode** – 10 sessions/month to explain code in plain English
- ✅ **Single AI Provider** – Powered by Groq (fast and free)
- ✅ **Community Access** – Learn from other devs, share insights
- ❌ No advanced AI features, team tools, or code generation

### Pro Tier – $19/month (Gumroad License Key)
- ✅ **Unlimited AI Analyses** – No limits, ever
- ✅ **Advanced Mentor Mode** – Context-aware, interactive guidance
- ✅ **Smart Code Generation** – Tests, docs, refactors on demand
- ✅ **Proactive Health Scan** – Analyze your entire codebase for complexity, debt, and vulnerabilities
- ✅ **Refactor Suggestions** – Clear, actionable fixes with step-by-step improvements

---

## 📦 Installation

Install globally using npm:

```bash
npm install -g bugblaze
```

---

## 🔑 Set Up Your API & License

BugBlaze uses AI models to analyze your code. Here's how to configure it:

1️⃣ Get an API key from [Groq](https://console.groq.com) or another supported provider  
2️⃣ (Optional) Get your **Pro license** from [Gumroad](https://littleprince1218.gumroad.com/l/wgrtjq)

Then configure:

```bash
bugblaze config set apikey <your-api-key>
bugblaze config set licensekey <your-gumroad-license-key>   # Optional for Pro features
```

---

## 🚀 Usage

Analyze code and get AI-powered insights:

```bash
# Syntax + runtime analysis
bugblaze analyze path/to/your/file.js

# Explain errors with AI
bugblaze fun path/to/your/file.js --explain

# Get refactor suggestions (Pro)
bugblaze generate-refactor path/to/your/file.js

# Scan entire project for code health issues (Pro)
bugblaze health-scan

# Mentor mode: plain-English code walkthroughs (Pro)
bugblaze mentor path/to/your/file.js
```

---

## 🛠️ Supported Languages

- JavaScript (.js)
- TypeScript (.ts)
- Python (.py)
- Java (.java)
- JSX/TSX (.jsx/.tsx)

---

## 🌐 Community

Join the BugBlaze community:  
- 💬 Share your code  
- 🔍 Get feedback  
- 🎓 Learn together  

---

## 📣 Feedback & Support

Got questions or ideas?  
- 💌 Reach out: [Your Email/Contact]  
- 🛠️ Submit issues: [GitHub Link]  

---

## 🏷️ License

ISC License.
