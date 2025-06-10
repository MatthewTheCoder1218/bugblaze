#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import ts from 'typescript';
import { parse as pythonParse } from 'python-ast';
import javaParser from 'java-parser';
import Groq from 'groq-sdk';
import { parse } from '@babel/parser';
import path from 'path';
import os from 'os';
import { handleConfigCommand } from './commands/config.js';
import { checkIfPremium } from './utils/premium.js';
import { globby } from 'globby';

const program = new Command();
const configPath = path.join(process.cwd(), '.bugblazerc.json'); // Fixed to match config.js

// Initialize Groq with API key - now returns null if no config
function getGroqClient() {
  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!config.apikey) {
      return null;
    }
    return new Groq({ apiKey: config.apikey });
  } catch (error) {
    return null;
  }
}

// Get config data
function getConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    return null;
  }
}

// Check premium status and update config
async function checkAndUpdatePremiumStatus() {
  const config = getConfig();
  if (!config) return { isPremium: false };

  // If no license key, definitely not premium
  if (!config.licensekey) {
    return { isPremium: false };
  }

  try {
    // Check with your backend
    const premiumResult = await checkIfPremium(config.licensekey);
    
    // Update config with premium status
    config.isPremium = premiumResult.isPremium;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    
    return premiumResult;
  } catch (error) {
    console.log(chalk.yellow('⚠️ Could not verify premium status, using free tier'));
    return { isPremium: false };
  }
}

function detectLanguage(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  if (ext === 'js') return 'javascript';
  if (ext === 'ts') return 'typescript';
  if (ext === 'py') return 'python';
  if (ext === 'java') return 'java';
  if (ext === 'jsx') return 'jsx';
  if (ext === 'tsx') return 'tsx';
  return null;
}

async function explainError(errorMessage, code) {
  try {
    console.log(chalk.cyan('🧠 Analyzing error...'));
    
    // Check premium status first
    const premiumStatus = await checkAndUpdatePremiumStatus();
    
    // Then get Groq client
    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }

    const systemPrompt = premiumStatus.isPremium 
      ? "You are a helpful programming assistant. Format your response exactly like this without any markdown:\n" +
        "ERROR:\n<brief error description>\n\n" +
        "CAUSE:\n<main reason>\n\n" +
        "FIX:\n<numbered steps>\n\n" +
        "PREVENTION:\n<quick tip>\n\n" +
        "EXAMPLE:\n<code example>\n\n" +
        "Do not use any special formatting, markdown, or code blocks."
      : "You are a programming assistant. Briefly explain the error's main cause and provide a basic fix suggestion in 2-3 sentences. End with '.'";

    const maxTokens = premiumStatus.isPremium ? 500 : 100;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Explain this error and how to fix it:
Error: ${errorMessage}

Code:
${code}

${premiumStatus.isPremium ? 'Provide comprehensive analysis and multiple solutions.' : 'Provide only the most critical fix.'}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: maxTokens
    });

    const explanation = completion.choices[0]?.message?.content;
    if (explanation) {
      console.log(chalk.cyan('\n📚 AI Explanation:'));
      console.log(chalk.white(explanation));

      if (!premiumStatus.isPremium) {
        console.log(chalk.yellow('\n💎 Want deeper code analysis?'));
        console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
      }
    }
  } catch (err) {
    console.log(chalk.red('\n❌ AI Explanation failed:'));
    console.log(chalk.yellow(err.message));
  }
}

async function analyzeCode(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');

    console.log(chalk.cyan('🧠 Analyzing code for logical or runtime issues...'));
    
    // Check premium status first
    const premiumStatus = await checkAndUpdatePremiumStatus();
    
    // Then get Groq client
    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }

    const systemPrompt = premiumStatus.isPremium 
      ? "You are a helpful programming assistant. Format your response exactly like this without any markdown:\n" +
        "ERROR:\n<brief error description>\n\n" +
        "CAUSE:\n<main reason>\n\n" +
        "FIX:\n<numbered steps>\n\n" +
        "PREVENTION:\n<quick tip>\n\n" +
        "EXAMPLE:\n<code example>\n\n" +
        "Do not use any special formatting, markdown, or code blocks."
      : "You are a programming assistant. Analyze the code briefly and provide only the most critical issue. Keep it under 2 sentences and end with '.'";

    const maxTokens = premiumStatus.isPremium ? 500 : 150;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analyze this code:
File: ${filePath}

Code:
${code}

${premiumStatus.isPremium ? 'Provide a detailed analysis with all issues and improvements.' : 'Identify the most critical issue only.'}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: maxTokens
    });

    const analysis = completion.choices[0]?.message?.content;
    if (analysis) {
      console.log(chalk.cyan('\n📚 AI Analysis:'));
      console.log(chalk.white(analysis));

      if (!premiumStatus.isPremium) {
        console.log(chalk.yellow('\n💎 Want deeper code analysis?'));
        console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
      }
    }
  } catch (err) {
    console.log(chalk.red('\n❌ AI Analysis failed:'));
    console.log(chalk.yellow(err.message));
  }
}

async function generateUnitTests(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');

    console.log(chalk.cyan('🧪 Generating unit tests...'));
    
    // Check premium status first
    const premiumStatus = await checkAndUpdatePremiumStatus();
    
    // Then get Groq client
    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }

    const systemPrompt = premiumStatus.isPremium 
      ? "You are a helpful programming assistant. Format your response exactly like this without any markdown:\n" +
        "TESTS:\n<unit tests in the correct format>\n\n" +
        "Do not use any special formatting, markdown, or code blocks."
      : "This feature is only available for premium users. Please upgrade to access unit test generation.";

    const maxTokens = premiumStatus.isPremium ? 500 : 150;

    if (!premiumStatus.isPremium) {
      console.log(chalk.yellow('💎 Unit test generation is a premium feature.'));
      console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
      return;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate unit tests for this code:
          ${code}

${premiumStatus.isPremium ? 'Provide a detailed analysis with all tests and what they do' : 'This feature is only available for premium users.'}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: maxTokens
    });

    const test = completion.choices[0]?.message?.content;
    if (test) {
      console.log(chalk.cyan('\n🧪 Generated Unit Tests:'));
      console.log(chalk.white(test));
    } else {
      console.log(chalk.yellow('No tests generated.'));
    }
  } catch (err) {
    console.log(chalk.red('\n❌ Unit test generation failed:'));
    console.log(chalk.yellow(err.message))
  }
}

async function generateDocumentation(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');

    console.log(chalk.cyan('📄 Generating documentation...'));
    
    // Check premium status first
    const premiumStatus = await checkAndUpdatePremiumStatus();
    
    // Then get Groq client
    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }

    const systemPrompt = premiumStatus.isPremium 
      ? "You are a helpful programming assistant. Format your response exactly like this without any markdown:\n" +
        "DOCUMENTATION:\n<detailed documentation in the correct format>\n\n" +
        "Use markdown for readme files."
      : "This feature is only available for premium users. Please upgrade to access documentation generation.";

    const maxTokens = premiumStatus.isPremium ? 500 : 150;

    if (!premiumStatus.isPremium) {
      console.log(chalk.yellow('💎 Documentation generation is a premium feature.'));
      console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
      return;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Generate documentation for this code:
          ${code}
          ${premiumStatus.isPremium ? 'Provide a detailed documentation for the code.' : 'This feature is only for premium users.'}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: maxTokens
    });

    const documentation = completion.choices[0]?.message?.content;
    if (documentation) {
      console.log(chalk.cyan('\n📄 Generated documentation'));
      console.log(chalk.white(documentation));
    } else {
      console.log(chalk.yellow('No docs generated'));
    }
  } catch (err) {
    console.log(chalk.red('\n❌ Documentation generation failed:'))
    console.log(chalk.yellow(err.message))
  }
}

async function generateRefactorSuggestions(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');

    console.log(chalk.cyan('⚡ Generating refactor suggestions...'));
    const premiumStatus = await checkAndUpdatePremiumStatus();

    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }

    const systemPrompt = premiumStatus.isPremium
      ? "You are a helpful programming assistant. Format your response exactly like this without any markdown:\n" +
        "CODE PROBLEMS:\n<detailed explanation in the correct format>\n\n" +
        "WHAT TO FIX:\n<detailed ways on what to fix in the code in the correct format>\n\n" +
        "Do not use any special formatting, markdown, or code blocks."
      : "This feature is only available for premium users. Please upgrade to access refactor suggestions.";

      const maxTokens = premiumStatus.isPremium ? 500 : 150;

      if (!premiumStatus.isPremium) {
      console.log(chalk.yellow('💎 Documentation generation is a premium feature.'));
      console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
      return;
    }

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate refactor suggestions for this code:
              ${code}
              ${premiumStatus.isPremium ? 'Provide detailed refactor suggestions for this code without hurting the logic' : 'This feature is for premium users only'}
            `
          }
        ],
        model: "llama3-8b-8192",
        temperature: 0.3,
        max_tokens: maxTokens
      });

      const suggestions = completion.choices[0]?.message?.content;
      if (suggestions) {
        console.log(chalk.cyan('\n⚡ Refactor Suggestions:'))
        console.log(chalk.white(suggestions))
      } else {
      console.log(chalk.yellow('No docs generated'));
    }
  } catch (err) {
    console.log(chalk.red('\n❌ Documentation generation failed:'))
    console.log(chalk.yellow(err.message))
  }
}

async function mentorMode(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    console.log(chalk.cyan('🎓 Entering mentor mode...'));
    const premiumStatus = await checkAndUpdatePremiumStatus();

    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }
    const systemPrompt = premiumStatus.isPremium
      ? "You are a helpful programming mentor. Format your response exactly like this without any markdown:\n" +
        "\n<detailed mentoring in the correct format line by line in a friendly manner>\n\n" +
        "Do not use any special formatting, markdown, or code blocks."
      : "This feature is only available for premium users. Please upgrade to access mentor mode.";

  const maxTokens = premiumStatus.isPremium ? 500 : 150;
  if (!premiumStatus.isPremium) {
    console.log(chalk.yellow('💎 Mentor mode is a premium feature.'));
    console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
    return;
  }

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: "user",
        content: `Mentor me on this code:
          ${code}
          ${premiumStatus.isPremium ? 'Provide detailed mentoring for this code line by line in a friendly manner' : 'This feature is for premium users only'}
        `
      }
    ],
    model: "llama3-8b-8192",
    temperature: 0.3,
    max_tokens: maxTokens
  });

  const mentoring = completion.choices[0]?.message?.content;
  if (mentoring) {
    console.log(chalk.cyan('\n🎓 Mentor Mode:'));
    console.log(chalk.white(mentoring));
  } else {
    console.log(chalk.yellow('No mentoring provided.'));
  }
  } catch (err) {
    console.log(chalk.red('\n❌ Mentor mode failed:'));
    console.log(chalk.yellow(err.message));
  }
}

async function scanHealth() {
  console.log(chalk.cyan('🔍 Scanning codebase for health issues...'));

  const premiumStatus = await checkAndUpdatePremiumStatus();
  const groq = getGroqClient();
  if (!groq) {
    console.log(chalk.red('❌ API key not found.'));
    console.log(chalk.yellow('Please set your API key using:'));
    console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
    return;
  }

  if (!premiumStatus.isPremium) {
    console.log(chalk.yellow('💎 Code health scanning is a premium feature.'));
    console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
    return;
  }

  const files = await globby(['**/*.js', '**/*.ts', '**/*.py', '**/*.java', '**/*.jsx', '**/*.tsx'], { gitignore: true });

  if (files.length === 0) {
    console.log(chalk.yellow('No code files found to scan.'));
    return;
  }

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');
    console.log(chalk.blue(`\n📂 Analyzing: ${file}`));

    const systemPrompt = `You are a helpful programming assistant. For each file, provide a health report:
- Code quality: (High/Medium/Low)
- Bugs found: (List key bugs or say "None")
- Performance issues: (List issues or say "None")
- Refactoring opportunities: (List or say "None")
- Security concerns: (List or say "None")
Format exactly like:
HEALTH REPORT:
<Report here>
No markdown or styling.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this code for health issues:\n${code}` }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 500
    });

    const report = completion.choices[0]?.message?.content;
    if (report) {
      console.log(chalk.cyan('🔍 Scanned codebase for health issues'));
      console.log(chalk.white(report));
    } else {
      console.log(chalk.yellow('No report generated.'));
    }
  }
}

async function generateCodebase(projectDescription) {
  const originalDir = process.cwd();

  try {
    console.log(chalk.cyan('🏗️  Generating codebase structure...'));

    const premiumStatus = await checkAndUpdatePremiumStatus();

    const groq = getGroqClient();
    if (!groq) {
      console.log(chalk.red('❌ API key not found.'));
      console.log(chalk.yellow('Please set your API key using:'));
      console.log(chalk.cyan('bugblaze config set apikey <your-api-key>'));
      return;
    }

    if (!premiumStatus.isPremium) {
      console.log(chalk.yellow('💎 Codebase generation is a premium feature.'));
      console.log(chalk.cyan('Get premium license and use: bugblaze config set licensekey <key>'));
      return;
    }

    const projectName = projectDescription
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const projectPath = path.join(originalDir, projectName);

    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
      console.log(chalk.green(`📁 Created project directory: ${projectName}`));
    }

    // 🔁 Request structured format from LLM
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a senior developer that generates codebases from user prompts.

- If the user request is simple (like "a file that prints hello world", "a single script", "just a function", or "one file"), generate ONLY a single file with just the code needed. Do NOT create folders, tests, configs, or extra files. Output ONLY the ---CONTENT--- section in this format:

---CONTENT---
==<filename>==
<actual file content>

- If the user request is for a full project, web app, API, CLI, or mentions multiple features, folders, or dependencies, generate a complete project structure in three sections as below:

---FOLDERS---
<list all folders only, e.g. src, public, utils>

---FILES---
<list all files only, without folder paths. group them under folder names like:
src:
  index.js
  app.js
utils:
  helpers.js
public:
  index.html
>

---CONTENT---
==<folder>/<filename>==
<actual file content>

==<folder>/<filename>==
<actual file content>

📌 RULES:
- NEVER use slashes in the filenames under ---FILES--- (e.g., use "helpers.js", NOT "utils/helpers.js").
- BUT in the ---CONTENT--- section, ALWAYS use the correct folder and filename with slashes (e.g., ==src/index.js==).
- You must match each file under ---FILES--- with a content block under ---CONTENT---.
- Do NOT assume technologies unless clearly implied.
- Do NOT leave out config files, dependencies, or documentation if relevant.
- Use correct file extensions based on language/framework used.
- Never generate the node_modules folder`
        },
        {
          role: 'user',
          content: `Create a complete project structure for: ${projectDescription}
Include:
- Appropriate programming language/framework
- Essential dependencies but with the node_modules folder not included
- Configuration files
- Documentation
- Testing setup
- Development tooling only if the project requires
 that for example a big project else make it only one file or the amount of files needed`
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.3,
      max_tokens: 2000
    });

    const generated = completion.choices[0]?.message?.content;
    if (!generated) throw new Error('No content generated');
    if (!generated.includes('---FOLDERS---') || !generated.includes('---FILES---') || !generated.includes('---CONTENT---')) {
      throw new Error('Missing one of ---FOLDERS---, ---FILES---, or ---CONTENT--- sections.');
    }

    // 🧠 Parse sections
    const [, foldersSection, filesSection, contentsSection] = generated.split(/---FOLDERS---|---FILES---|---CONTENT---/);

    // ✨ Create folders
// ✨ Create folders
    const folders = foldersSection.trim().split('\n').filter(Boolean);
    for (const folder of folders) {
      // Only create if it does NOT look like a file (no dot in last segment)
      const trimmed = folder.trim();
      if (!path.basename(trimmed).includes('.')) {
        const fullFolderPath = path.join(projectPath, trimmed);
        fs.mkdirSync(fullFolderPath, { recursive: true });
        console.log(chalk.green(`📁 Created folder: ${trimmed}`));
      }
    }

  // ✍️ Write content to files
  const fileRegex = /^==(.+?)==\s*\r?\n([\s\S]*?)(?=^==|\Z)/gm;
  let match;
  let wroteAny = false;
  while ((match = fileRegex.exec(contentsSection)) !== null) {
    const [, filePath, content] = match;
    const fullPath = path.join(projectPath, filePath.trim());
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(chalk.green(`📝 Wrote content to: ${filePath.trim()}`));
    wroteAny = true;
  }
  if (!wroteAny) {
    console.log(chalk.red('❌ No files were written. Regex did not match any blocks.'));
  }

    console.log(chalk.cyan('\n✨ Codebase generated successfully!'));
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.white(`1. cd ${projectName}`));
    console.log(chalk.white('2. npm install'));
    console.log(chalk.white('3. Review generated files'));
    console.log(chalk.white('4. Start coding!'));

  } catch (err) {
    console.log(chalk.red('\n❌ Error generating codebase:'));
    console.log(chalk.yellow(err.message));
  }
}


async function analyzeFile(filePath, options = {}) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    const lang = detectLanguage(filePath);

    if (!lang) {
      console.log(chalk.red('❌ Unsupported file extension.'));
      return;
    }

    let diagnostics = [];
    switch (lang) {
      case 'javascript':
        diagnostics = await getJSDiagnostics(code, filePath);
        break;
      case 'typescript':
        case 'tsx':
        diagnostics = getTSDiagnostics(code, filePath);
        break;
      case 'python':
        diagnostics = getPythonDiagnostics(code, filePath);
        break;
      case 'java':
        diagnostics = getJavaDiagnostics(code, filePath);
        break;
      case 'jsx':
        diagnostics = getJSXDiagnostics(code, filePath);
        break;
    }

    if (diagnostics.length === 0) {
      console.log(chalk.green('✅ No syntax errors found.'));
      if (options.analyze) {
        await analyzeCode(filePath);
      }
    } else {
      printDiagnostics(diagnostics);
      if (options.explain && diagnostics.length > 0) {
        await explainError(diagnostics[0].message, code);
      }
    }
  } catch (err) {
    console.log(chalk.red('⚠️ Could not read the file:'), err.message);
  }
}

// Rest of your diagnostic functions remain the same...
function getJSDiagnostics(code, filePath) {
  const compilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    allowJs: true,
    checkJs: true,
    noEmit: true
  };

  try {
    const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
    const compilerHost = ts.createCompilerHost(compilerOptions);

    const program = ts.createProgram({
      rootNames: [filePath],
      options: compilerOptions,
      host: compilerHost
    });

    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);

    if (syntacticDiagnostics.length === 0 && semanticDiagnostics.length === 0) {
      return [];
    }

    return [
      ...syntacticDiagnostics,
      ...semanticDiagnostics
    ].map(diag => ({
      message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
      line: diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1 : 0,
      column: diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start).character + 1 : 0
    }));
  } catch (err) {
    console.log(chalk.red('⚠️ TypeScript encountered an error while analyzing the file:'), err.message);
    return [{
      message: `Critical error: ${err.message}`,
      line: 0,
      column: 0
    }];
  }
}

function getJSXDiagnostics(code, filePath) {
  try {
    parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    return [];
  } catch (err) {
    return [{
      message: err.message,
      line: err.loc?.line || 0,
      column: err.loc?.column || 0
    }];
  }
}

function getTSDiagnostics(code, filePath) {
  const compilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    lib: ['es2022', 'dom'],
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    allowJs: true,
    checkJs: true,
    noEmit: true
  };

  const compilerHost = ts.createCompilerHost(compilerOptions);
  compilerHost.getSourceFile = (fileName, languageVersion) => {
    if (fileName === filePath) {
      return ts.createSourceFile(fileName, code, languageVersion, true);
    }
    return undefined;
  };

  compilerHost.fileExists = (fileName) => fileName === filePath;
  compilerHost.readFile = (fileName) => (fileName === filePath ? code : undefined);
  compilerHost.getCanonicalFileName = (fileName) => fileName;
  compilerHost.getCurrentDirectory = () => '';
  compilerHost.getNewLine = () => '\n';

  const program = ts.createProgram({
    rootNames: [filePath],
    options: compilerOptions,
    host: compilerHost
  });

  return [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics()
  ].map(diag => ({
    message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
    line: diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1 : 0,
    column: diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start).character + 1 : 0
  }));
}

function getPythonDiagnostics(code, filePath) {
  try {
    pythonParse(code);
    return [];
  } catch (err) {
    return [{
      message: err.message,
      line: err.lineNumber || 0,
      column: err.columnNumber || 0
    }];
  }
}

function getJavaDiagnostics(code, filePath) {
  try {
    javaParser.parse(code);
    return [];
  } catch (err) {
    return [{
      message: err.message,
      line: err.token?.startLine || 0,
      column: err.token?.startColumn || 0
    }];
  }
}

function printDiagnostics(diagnostics) {
  diagnostics.forEach((diag) => {
    console.log(chalk.red('❌ Syntax error detected:'));
    console.log(chalk.yellow(diag.message));
    if (diag.line && diag.column) {
      console.log(`📍 Line: ${diag.line}, Column: ${diag.column}`);
    }
  });
}

// CLI commands
program
  .command('fun <file>')
  .description('Analyze a source file and detect syntax issues (JS, TS, Python, Java)')
  .option('-e, --explain', 'Get AI explanation for errors')
  .action(async (file, options) => {
    await analyzeFile(file, options);
  });

program
  .command('analyze <file>')
  .description('Analyze a source file for logical or runtime issues using AI')
  .action(async (file) => {
    await analyzeCode(file);
  });

// Remove both existing generate commands and replace with this:

program
  .command('generate')
  .description('Generate code and project resources (some features are Premium)')
  .argument('<type>', 'Type of generation: codebase, tests, docs, refactor')
  .argument('[input]', 'File path or project description')
  .action(async (type, input) => {
    switch (type) {
      case 'codebase':
        if (!input) {
          console.log(chalk.red('❌ Please provide a project description'));
          return;
        }
        await generateCodebase(input);
        break;
      case 'tests':
        if (!input) {
          console.log(chalk.red('❌ Please provide a file path'));
          return;
        }
        await generateUnitTests(input);
        break;
      case 'docs':
        if (!input) {
          console.log(chalk.red('❌ Please provide a file path'));
          return;
        }
        await generateDocumentation(input);
        break;
      case 'refactor':
        if (!input) {
          console.log(chalk.red('❌ Please provide a file path'));
          return;
        }
        await generateRefactorSuggestions(input);
        break;
      default:
        console.log(chalk.red('❌ Invalid generation type'));
        console.log(chalk.yellow('Available types:'));
        console.log(chalk.white('- codebase: Generate new project structure'));
        console.log(chalk.white('- tests: Generate unit tests'));
        console.log(chalk.white('- docs: Generate documentation'));
        console.log(chalk.white('- refactor: Generate refactor suggestions'));
    }
  });

program
  .command('health-scan')
  .description('Scan the entire codebase for health issues (Premium feature)')
  .action(async () => {
    await scanHealth();
  });

program
  .command('mentor <file>')
  .description('Enter mentor mode to get detailed line-by-line mentoring on your code (Premium feature)')
  .action(async (file) => {
    await mentorMode(file);
  });


program
  .command('config')
  .description('Configure BugBlaze settings')
  .argument('[action]', 'Action to perform: set, show, or delete')
  .argument('[type]', 'Type of setting (e.g., apikey)')
  .argument('[value]', 'Value to set')
  .action(async (action, type, value) => {
    try {
      await handleConfigCommand([action, type, value].filter(Boolean));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);