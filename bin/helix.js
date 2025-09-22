#!/usr/bin/env node

/**
 * Helix CLI - Fullstack FBCA Framework
 * Combines UIKit (frontend) and AppKit (backend) scaffolding
 */

import { execSync } from 'child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const command = process.argv[2];
const projectName = process.argv[3];

/**
 * Convert CommonJS package.json to ESM module
 */
function convertToESM(packageObj) {
  // Convert type to module if it's commonjs or missing
  if (!packageObj.type || packageObj.type === 'commonjs') {
    packageObj.type = 'module';
    console.log('🔄 Converting package.json from CommonJS to ESM');
  }

  return packageObj;
}

/**
 * Merge Helix fullstack package.json template with existing package.json
 */
async function mergeHelixPackageJson() {
  try {
    // Read existing package.json (created by UIKit/AppKit)
    let existingPackage = JSON.parse(readFileSync('./package.json', 'utf8'));

    // Convert to ESM if needed
    existingPackage = convertToESM(existingPackage);

    // Read Helix template package.json
    const templatePath = join(__dirname, '../templates/package.json');
    const helixTemplate = JSON.parse(readFileSync(templatePath, 'utf8'));

    // Ensure dependencies object exists
    if (!existingPackage.dependencies) existingPackage.dependencies = {};
    if (!existingPackage.devDependencies) existingPackage.devDependencies = {};

    // Merge missing dependencies
    for (const [dep, version] of Object.entries(
      helixTemplate.dependencies || {}
    )) {
      if (!existingPackage.dependencies[dep]) {
        existingPackage.dependencies[dep] = version;
      }
    }

    // Merge missing devDependencies
    for (const [dep, version] of Object.entries(
      helixTemplate.devDependencies || {}
    )) {
      if (!existingPackage.devDependencies[dep]) {
        existingPackage.devDependencies[dep] = version;
      }
    }

    // Add/override fullstack scripts
    const helixScripts = {
      dev: 'concurrently "npm run dev:api" "npm run dev:web"',
      'dev:api': 'API_ONLY=true nodemon --exec tsx src/api/server.ts',
      'dev:web': 'cd src/web && vite',
      build: 'npm run build:clean && npm run build:web && npm run build:api',
      'build:clean': 'rm -rf dist',
      'build:web': 'cd src/web && tsc && vite build --outDir ../../dist',
      'build:api': 'tsc --project tsconfig.api.json',
      start: 'node dist/api/server.js',
      'start:dev': 'tsx src/api/server.ts',
      preview: 'npm run build && npm run start',
      'lint:api':
        'eslint src/api --ext ts --report-unused-disable-directives --max-warnings 0',
      'lint:web':
        'eslint src/web --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
    };

    // Ensure scripts object exists
    if (!existingPackage.scripts) existingPackage.scripts = {};

    // Add/override Helix scripts
    for (const [script, command] of Object.entries(helixScripts)) {
      existingPackage.scripts[script] = command;
    }

    // Update description to reflect fullstack nature
    existingPackage.description =
      'Full-stack FBCA application with UIKit frontend and AppKit backend';

    // Add Helix to keywords if not present
    if (!existingPackage.keywords) existingPackage.keywords = [];
    if (!existingPackage.keywords.includes('helix')) {
      existingPackage.keywords.push('helix');
    }

    // Write updated package.json
    writeFileSync(
      './package.json',
      JSON.stringify(existingPackage, null, 2) + '\n'
    );
    console.log(
      '✅ Updated package.json with fullstack scripts and dependencies'
    );
  } catch (error) {
    console.warn(
      '⚠️ Warning: Could not merge Helix package.json template:',
      error.message
    );
  }
}

if (!command) {
  console.log(`
🔥 Helix Framework - Fullstack FBCA

Usage:
  helix create <project-name>  Create new fullstack project
  helix create .               Install in current directory

Commands:
  create    Scaffold new fullstack app with UIKit + AppKit

Examples:
  helix create my-app          # Create new project in my-app/ directory
  helix create .               # Install in current directory
`);
  process.exit(1);
}

if (command === 'create') {
  if (!projectName) {
    console.error(
      '❌ Please provide a project name or "." for current directory: helix create <project-name>'
    );
    process.exit(1);
  }

  const isCurrentDir = projectName === '.';

  if (isCurrentDir) {
    console.log(`🚀 Installing Helix in current directory`);

    // Check if current directory has package.json and warn about overwrite
    if (existsSync('./package.json')) {
      console.log('📦 Found existing package.json - will merge with Helix configuration');
    }
  } else {
    console.log(`🚀 Creating Helix project: ${projectName}`);

    try {
      // Create project directory
      if (existsSync(projectName)) {
        console.error(`❌ Directory ${projectName} already exists`);
        process.exit(1);
      }

      mkdirSync(projectName);
      process.chdir(projectName);
    } catch (error) {
      console.error('❌ Error creating project directory:', error.message);
      process.exit(1);
    }
  }

  try {
    console.log('📱 Installing UIKit with FBCA template...');

    // Install UIKit globally and create FBCA frontend
    execSync('npm install -g @voilajsx/uikit', { stdio: 'inherit' });
    execSync('uikit create . --fbca --theme base', { stdio: 'inherit' });

    console.log('🔧 Installing AppKit and creating backend...');

    // Install AppKit globally and create backend
    execSync('npm install -g @voilajsx/appkit', { stdio: 'inherit' });
    execSync('appkit generate app', { stdio: 'inherit' });

    console.log('🔧 Updating package.json with fullstack scripts...');

    // Now merge the Helix fullstack template with the generated package.json
    await mergeHelixPackageJson();

    console.log('🎉 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    if (isCurrentDir) {
      console.log(`
✅ Helix installed successfully in current directory!

Development:
  npm run dev        # Start both frontend and backend
  npm run dev:api    # Start only backend (Express)
  npm run dev:web    # Start only frontend (Vite)

Production:
  npm run build      # Build both frontend and backend
  npm start          # Start production server
`);
    } else {
      console.log(`
✅ Project ${projectName} created successfully!

Next steps:
  cd ${projectName}

Development:
  npm run dev        # Start both frontend and backend
  npm run dev:api    # Start only backend (Express)
  npm run dev:web    # Start only frontend (Vite)

Production:
  npm run build      # Build both frontend and backend
  npm start          # Start production server
`);
    }
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  }
} else {
  console.error(`❌ Unknown command: ${command}`);
  process.exit(1);
}
