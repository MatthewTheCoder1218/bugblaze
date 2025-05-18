# BugBlaze

BugBlaze is a command-line tool that helps developers find and fix bugs in their code using AI. It supports multiple programming languages, including JavaScript, TypeScript, Python, and Java, and provides AI-powered insights to improve your code.

---

## Features

- **Syntax Error Detection:** Quickly identify syntax errors in your code
- **Logical Issue Analysis:** Analyze your code for runtime or logical issues
- **AI-Powered Explanations:** Get concise explanations of errors and suggestions for fixes
- **Multi-Language Support:** Works with JavaScript, TypeScript, Python, Java, and more

---

## Installation

BugBlaze is designed as a global CLI tool. Install it once and use it anywhere:

```bash
npm install -g bugblaze
```

After installation, the `bugblaze` command will be available globally in your terminal.

Then run:
```bash
bugblaze-init
```

To check if you are ready to use the package

## Usage

Since BugBlaze is installed globally, you can use it from any directory:

```bash
# Analyze a file for logical issues
bugblaze analyze path/to/your/file.js

# Get AI-powered explanations for errors
bugblaze fun path/to/your/file.js --explain
```

## Environment Variables

BugBlaze requires a `GROQ_API_KEY` to enable AI-powered features. Set it globally using your terminal:

### Windows (PowerShell):
```powershell
$env:GROQ_API_KEY="your-api-key"
```

### Windows (Command Prompt):
```cmd
set GROQ_API_KEY=your-api-key
```

### Linux/Mac:
```bash
export GROQ_API_KEY="your-api-key"
```

Get your API key from [Groq Console](https://console.groq.com)

## Supported Languages

- JavaScript
- TypeScript
- Python
- Java
- JSX/TSX

## Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** Installed with Node.js
- **Global Installation:** The tool must be installed with the `-g` flag

## Troubleshooting

If the `bugblaze` command is not found after installation:
1. Verify the installation: `npm list -g bugblaze`
2. Check your Node.js global packages location
3. Ensure your PATH includes npm's global bin directory

## License

This project is licensed under the ISC License.

## Author

**Matthew Michael**

## Feedback

If you encounter any issues or have suggestions, feel free to check out my github repository at or contact me directly.