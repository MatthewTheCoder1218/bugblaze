#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import fs from 'fs';
import path from 'path';
import os from 'os';

const configPath = path.join(os.homedir(), 'bugblaze.config.js');

function createDefaultConfig() {
  const defaultContent = `module.exports = {\n  apiKey: '' // Add your GROQ API key here\n};\n`;
  fs.writeFileSync(configPath, defaultContent, 'utf-8');
}

function readConfig() {
  try {
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);
    return config;
  } catch {
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
    console.log(chalk.yellow('\nNo configuration found, creating default config file...'));
    createDefaultConfig();
    console.log(chalk.green(`✔ Created default config at ${configPath}`));
    console.log(chalk.yellow('\n💡 Please set your GROQ API key using this command:'));
    console.log(chalk.cyan('   bugblaze config set apikey <your-api-key>'));
    console.log(chalk.yellow('\nAlternatively, you can edit the config file manually.'));
    process.exit(0);
  }

  const config = readConfig();

  if (!config || !config.apiKey) {
    console.log(chalk.red('\n❌ API key not found in config!'));
    console.log(chalk.yellow('💡 Set your GROQ API key using:'));
    console.log(chalk.cyan('   bugblaze config set apikey <your-api-key>'));
    process.exit(1);
  }

  console.log(chalk.green('\n✔ API key found!'));
  console.log(chalk.blue('\nYou are ready to use BugBlaze CLI!'));

  // You can list available commands here if you want:
  console.log(chalk.yellow('\n📚 Available commands:'));
  console.log(chalk.cyan('  bugblaze analyze <file-path>    Analyze code for issues'));
  console.log(chalk.cyan('  bugblaze fun <file-path>        Get AI explanations for errors'));
  console.log(chalk.cyan('  bugblaze config set apikey <key>  Set your API key'));

  process.exit(0);
});
