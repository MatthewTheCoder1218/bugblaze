#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

const configPath = path.join(process.cwd(), '.bugblazerc.json');

function saveConfig(type, value) {
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  config[type] = value;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(chalk.green(`✔ ${type} saved successfully!`));
}

function showConfig() {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(chalk.blue('\nCurrent Configuration:'));
    Object.entries(config).forEach(([key, value]) => {
      console.log(`${key}: ${key.includes('key') ? value.slice(0, 4) + '...' + value.slice(-4) : value}`);
    });
  } else {
    console.log(chalk.yellow('No configuration file found.'));
  }
}

function deleteConfig() {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log(chalk.green('✔ Configuration deleted successfully!'));
  } else {
    console.log(chalk.yellow('No configuration file found.'));
  }
}

export async function handleConfigCommand(args) {
  const [action, type, value] = args;

  switch (action) {
    case 'set':
      if (!['apikey', 'licensekey'].includes(type) || !value) {
        console.log(chalk.red('❌ Invalid command'));
        console.log(chalk.yellow('Usage:'));
        console.log(chalk.cyan('  bugblaze config set apikey <your-groq-api-key>'));
        console.log(chalk.cyan('  bugblaze config set licensekey <your-gumroad-license-key>'));
        return;
      }
      saveConfig(type, value);
      break;

    case 'show':
      showConfig();
      break;

    case 'delete':
      deleteConfig();
      break;

    default:
      console.log(chalk.yellow('Available commands:'));
      console.log(chalk.cyan('  bugblaze config set apikey <your-groq-api-key>'));
      console.log(chalk.cyan('  bugblaze config set licensekey <your-gumroad-license-key>'));
      console.log(chalk.cyan('  bugblaze config show'));
      console.log(chalk.cyan('  bugblaze config delete'));
  }
}
