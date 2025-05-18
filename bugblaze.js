#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import ts from 'typescript';
import { parse as pythonParse } from 'python-ast';
import javaParser from 'java-parser';
import Groq from 'groq-sdk';
import { parse } from '@babel/parser';

const program = new Command();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
    console.log(chalk.blue('🧠 Analyzing error...'));

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful programming assistant. Explain programming errors clearly and concisely and shortly showing what the error means and how to fix it only."
        },
        {
          role: "user",
          content: `Explain this error and how to fix it:
Error: ${errorMessage}

Code:
${code}

Provide a clear explanation and show the corrected code example.`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 300
    });

    const explanation = completion.choices[0]?.message?.content;
    if (explanation) {
      console.log(chalk.blue('\n📚 AI Explanation:'));
      console.log(chalk.white(explanation));
    }
  } catch (err) {
    console.log(chalk.red('\n❌ AI Explanation failed:'));
    if (!process.env.GROQ_API_KEY) {
      console.log(chalk.yellow('💡 Set your GROQ_API_KEY environment variable'));
      console.log(chalk.gray('Get your API key at: https://console.groq.com'));
    } else {
      console.log(chalk.yellow(err.message));
    }
  }
}

async function analyzeCode(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');

    console.log(chalk.blue('🧠 Analyzing code for logical or runtime issues...'));

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful programming assistant. Analyze the provided code for logical or runtime issues and suggest improvements clearly, concisely and shortly showing why it doesn't work and how to fix it only."
        },
        {
          role: "user",
          content: `Analyze this code for logical or runtime issues and suggest improvements:
File: ${filePath}

Code:
${code}

Provide a detailed explanation of any issues and suggest improvements.`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 300
    });

    const analysis = completion.choices[0]?.message?.content;
    if (analysis) {
      console.log(chalk.blue('\n📚 AI Analysis:'));
      console.log(chalk.white(analysis));
    }
  } catch (err) {
    console.log(chalk.red('\n❌ AI Analysis failed:'));
    if (!process.env.GROQ_API_KEY) {
      console.log(chalk.yellow('💡 Set your GROQ_API_KEY environment variable'));
      console.log(chalk.gray('Get your API key at: https://console.groq.com'));
    } else {
      console.log(chalk.yellow(err.message));
    }
  }
}

async function analyzeFile(filePath, options = {}) {  // Add options parameter with default empty object
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
      case 'jsx': // Use the new JSX diagnostics function
        diagnostics = getJSXDiagnostics(code, filePath);
        break;
    }

    if (diagnostics.length === 0) {
      console.log(chalk.green('✅ No syntax errors found.'));
      if (options.analyze) {
        await analyzeCode(code, filePath); // Perform logical analysis if requested
      }
    } else {
      printDiagnostics(diagnostics);
      if (options.explain && diagnostics.length > 0) {  // Now options is defined
        await explainError(diagnostics[0].message, code);
      }
    }
  } catch (err) {
    console.log(chalk.red('⚠️ Could not read the file:'), err.message);
  }
}

// JavaScript syntax checker using ESLint
// JavaScript syntax checker using ESLint
// JavaScript syntax checker using TypeScript
function getJSDiagnostics(code, filePath) {
  const compilerOptions = {
    ...ts.getDefaultCompilerOptions(),
    allowJs: true,  // Allow JavaScript files
    checkJs: true,  // Enable type checking for JavaScript
    noEmit: true  // Prevent emitting output files
  };

  try {
    const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true);
    const compilerHost = ts.createCompilerHost(compilerOptions);

    const program = ts.createProgram({
      rootNames: [filePath],
      options: compilerOptions,
      host: compilerHost
    });

    // Collect diagnostics
    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    const semanticDiagnostics = program.getSemanticDiagnostics(sourceFile);

    // If there are no diagnostics, return an empty array
    if (syntacticDiagnostics.length === 0 && semanticDiagnostics.length === 0) {
      return [];
    }

    // Map diagnostics to a readable format
    return [
      ...syntacticDiagnostics,
      ...semanticDiagnostics
    ].map(diag => ({
      message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
      line: diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1 : 0,
      column: diag.file ? diag.file.getLineAndCharacterOfPosition(diag.start).character + 1 : 0
    }));
  } catch (err) {
    // Log the actual error message for debugging
    console.log(chalk.red('⚠️ TypeScript encountered an error while analyzing the file:'), err.message);

    // Return a fallback diagnostic with the error message
    return [{
      message: `Critical error: ${err.message}`,
      line: 0,
      column: 0
    }];
  }
}

function getJSXDiagnostics(code, filePath) {
  try {
    // Parse the code using Babel's parser
    parse(code, {
      sourceType: 'module',
      plugins: ['jsx'] // Enable JSX parsing
    });

    // If parsing succeeds, return no diagnostics
    return [];
  } catch (err) {
    // If parsing fails, return the error details
    return [{
      message: err.message,
      line: err.loc?.line || 0,
      column: err.loc?.column || 0
    }];
  }
}

// TypeScript syntax checker
function getTSDiagnostics(code, filePath) {
  const compilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    lib: ['es2022', 'dom'], // Add required libraries
    moduleResolution: ts.ModuleResolutionKind.NodeNext, // Add module resolution
    strict: true,
    jsx: ts.JsxEmit.React, // Enable JSX support
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

// Python syntax checker
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

// Java syntax checker
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

// CLI command
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

program.parse(process.argv);