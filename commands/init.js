#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import fs from 'fs';
import path from 'path';
import os from 'os';

const configPath = path.join(process.cwd(), '.bugblazerc.json');

// Config creation handled elsewhere

function readConfig() {
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(configContent);
    return parsed;
  } catch (error) {
    return null;
  }
}

figlet('Welcome to BugBlaze!', (err, data) => {
  if (err) {
    console.log(chalk.red('Error generating ASCII art'));
    return;
  }
  console.log(chalk.green(data));

  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('\n❌ Configuration file not found!'));
    console.log(chalk.yellow('💡 Set your GROQ API key using:'));
    console.log(chalk.cyan('   bugblaze config set apikey <your-api-key>'));
    process.exit(1);
  }

  const config = readConfig();

  if (!config || !config.apikey) {
    console.log(chalk.red('\n❌ API key not found in config!'));
    console.log(chalk.yellow('💡 Set your GROQ API key using:'));
    console.log(chalk.cyan('   bugblaze config set apikey <your-api-key>'));
    process.exit(1);
  }

  console.log(chalk.green('\n✔ API key found!'));
  console.log(chalk.blue('\nYou are ready to use BugBlaze CLI!'));

  // You can list available commands here if you want:
  console.log(chalk.yellow('\n📚 Available commands for free:'));
  console.log(chalk.cyan('  bugblaze analyze <file-path>    Analyze code for issues'));
  console.log(chalk.cyan('  bugblaze fun <file-path>        Get AI explanations for errors'));

  console.log(chalk.yellow('\n💎 Available commands for PRO:'));
  console.log(chalk.cyan('  bugblaze generate-tests <file>  Generate tests for code'));
  console.log(chalk.cyan('  bugblaze generate-docs <file>  Generate documentation for code'));
  console.log(chalk.cyan('  bugblaze generate-refactor <file>  Generate refactoring suggestions'));
  console.log(chalk.cyan('  bugblaze health-scan <file>  Perform a health scan on codebase'));
  console.log(chalk.cyan('  bugblaze mentor <file>  Get AI mentorship for code issues'));

  process.exit(0);
});