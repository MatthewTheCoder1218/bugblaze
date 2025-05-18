#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const message = 'Welcome to BugBlaze!';

// Generate ASCII Art using figlet
figlet(message, (err, data) => {
  if (err) {
    console.log(chalk.red('Error generating ASCII art'));
    return;
  }

  console.log(chalk.green(data));
  console.log(chalk.yellow('\n🔍 Checking for required dependencies...'));

  // Check for Node.js
  try {
    execSync('node -v', { stdio: 'ignore' });
    console.log(chalk.green('✔ Node.js is installed.'));
  } catch {
    console.log(chalk.red('❌ Node.js is not installed. Please install it from https://nodejs.org.'));
    return;
  }

  // Check for npm
  try {
    execSync('npm -v', { stdio: 'ignore' });
    console.log(chalk.green('✔ npm is installed.'));
  } catch {
    console.log(chalk.red('❌ npm is not installed. Please install it from https://nodejs.org.'));
    return;
  }

  // Check for GROQ_API_KEY
  console.log(chalk.yellow('\n🔍 Checking for GROQ_API_KEY environment variable...'));

  if (!process.env.GROQ_API_KEY) {
    console.log(chalk.red('❌ GROQ_API_KEY is not set.'));
    console.log(chalk.yellow('💡 To set your GROQ_API_KEY environment variable, follow these instructions:'));
    console.log(chalk.cyan('\nFor Linux/Mac:'));
    console.log(chalk.cyan('   export GROQ_API_KEY="your-api-key"'));
    console.log(chalk.cyan('\nFor Windows (PowerShell):'));
    console.log(chalk.cyan('   $env:GROQ_API_KEY="your-api-key"'));
    console.log(chalk.cyan('\nFor Windows (Command Prompt):'));
    console.log(chalk.cyan('   set GROQ_API_KEY=your-api-key'));
    console.log(chalk.yellow('\n💡 Replace "your-api-key" with your actual API key.'));
    console.log(chalk.red('\n❌ Setup incomplete. Please get your API key from https://console.groq.com to use BugBlaze.'));
  } else {
    console.log(chalk.green('✔ GROQ_API_KEY is set.'));
    console.log(chalk.green('\n🎉 Setup complete! You can now use the BugBlaze CLI.'));

        // Display available commands
    console.log(chalk.blue('\n📚 Available Commands:'));
    console.log(chalk.white('\n1. Analyze code for issues:'));
    console.log(chalk.cyan('   bugblaze analyze path/to/file.js'));
    
    console.log(chalk.white('\n2. Get AI explanations for errors:'));
    console.log(chalk.cyan('   bugblaze fun path/to/file.js --explain'));
    
    console.log(chalk.white('\nSupported file types:'));
    console.log(chalk.gray('   • JavaScript (.js)'));
    console.log(chalk.gray('   • TypeScript (.ts)'));
    console.log(chalk.gray('   • Python (.py)'));
    console.log(chalk.gray('   • Java (.java)'));
    console.log(chalk.gray('   • JSX/TSX (.jsx/.tsx)'));
    
    console.log(chalk.yellow('\n💡 Run commands from any directory to analyze your code!'));
  }
});
