# BugBlaze

**AI-Powered Code Debugging & Analysis for Developers**

BugBlaze is a blazing-fast command-line tool that helps you **find, understand, and fix bugs** in your code—powered by AI. Whether you're a solo developer or part of a team, BugBlaze turns confusing errors into clear insights and actionable solutions.

---

## ✨ Features (Beta)

- ✅ **Unlimited AI Analyses** – No limits during beta!
- ✅ **Mentor Mode** – Context-aware, interactive guidance
- ✅ **Smart Code Generation** – Tests, docs, refactors on demand
- ✅ **Proactive Health Scan** – Analyze your entire codebase for complexity, debt, and vulnerabilities
- ✅ **Refactor Suggestions** – Clear, actionable fixes with step-by-step improvements
- ✅ **Community Access** – Learn from other devs, share insights

> **Note:** All features are free and unlocked during the beta period. No license key required!

---

## 📦 Installation

Install globally using npm:

```bash
npm install -g bugblaze
```

---

## 🔑 Set Up Your API Key

BugBlaze uses AI models to analyze your code.  
Get an API key from [Groq](https://console.groq.com) or another supported provider, then configure:

```bash
bugblaze config set apikey <your-api-key>
```

---

## 🚀 Usage

Analyze code and get AI-powered insights:

```bash
# Syntax + runtime analysis
bugblaze analyze path/to/your/file.js

# Explain errors with AI
bugblaze fun path/to/your/file.js --explain

# Generate unit tests
bugblaze generate tests path/to/your/file.js

# Generate documentation
bugblaze generate docs path/to/your/file.js

# Get refactor suggestions
bugblaze generate refactor path/to/your/file.js

# Scan entire project for code health issues
bugblaze health-scan

# Mentor mode: plain-English code walkthroughs
bugblaze mentor path/to/your/file.js

# Interactive AI chat (can answer about your files!)
bugblaze chat
```

---

## 🛠️ Supported Languages

- JavaScript (.js)
- TypeScript (.ts)
- Python (.py)
- Java (.java)
- JSX/TSX (.jsx/.tsx)

---

## 📣 Feedback & Support

Got questions or ideas?
- 🌐 [Website](https://bugblaze.vercel.app)
- 🛠️ [GitHub Issues](https://github.com/MatthewTheCoder1218/bugblaze)

---

## 🏷️ License

ISC License.
