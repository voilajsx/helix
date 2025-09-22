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
  readdirSync,
  statSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const command = process.argv[2];
const projectName = process.argv[3];
const templateType = process.argv[4] || 'basicapp'; // Default to basicapp

/**
 * Convert CommonJS package.json to ESM module
 */
function convertToESM(packageObj) {
  // Convert type to module if it's commonjs or missing
  if (!packageObj.type || packageObj.type === 'commonjs') {
    packageObj.type = 'module';
    // Silently convert - will be included in "Configuring fullstack integration" message
  }

  return packageObj;
}

/**
 * Copy Helix template files to the generated project
 */
function copyHelixTemplate(templateType) {
  try {
    const templatePath = join(__dirname, '../templates', templateType);

    if (!existsSync(templatePath)) {
      console.error(`❌ Template "${templateType}" not found at ${templatePath}`);
      return;
    }

    // Recursively copy template files, processing .template files
    function copyRecursive(sourcePath, destPath) {
      const items = readdirSync(sourcePath);

      for (const item of items) {
        const sourceItem = join(sourcePath, item);
        const stat = statSync(sourceItem);

        if (stat.isDirectory()) {
          const destItem = join(destPath, item);
          if (!existsSync(destItem)) {
            mkdirSync(destItem, { recursive: true });
          }
          copyRecursive(sourceItem, destItem);
        } else if (stat.isFile()) {
          // Handle .template files
          if (item.endsWith('.template')) {
            const destItem = join(destPath, item.replace('.template', ''));
            copyFileSync(sourceItem, destItem);
          } else {
            const destItem = join(destPath, item);
            copyFileSync(sourceItem, destItem);
          }
        }
      }
    }

    copyRecursive(templatePath, './');
    console.log('📋 Applied Helix template files');

  } catch (error) {
    console.error('❌ Error copying template files:', error.message);
    throw error;
  }
}

/**
 * Add VITE_API_URL to .env file for frontend API configuration
 */
function addViteApiUrl() {
  try {
    const envPath = './.env';

    // Check if .env exists
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, 'utf8');

      // Check if VITE_API_URL already exists
      if (!envContent.includes('VITE_API_URL')) {
        // Add VITE_API_URL to the end of the file
        envContent += '\n# Frontend API Configuration\nVITE_API_URL=http://localhost:3000\n';
        writeFileSync(envPath, envContent);
      }
    }
  } catch (error) {
    console.error('⚠️  Could not add VITE_API_URL to .env:', error.message);
    // Don't throw - this is not critical
  }
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
      dev: 'concurrently --names "API,WEB" --prefix-colors "blue,green" "npm run dev:api" "npm run dev:web"',
      'dev:api': 'API_ONLY=true NODE_ENV=development nodemon --exec tsx src/api/server.ts',
      'dev:web': 'cd src/web && vite --host',
      'dev:fullstack': 'npm run build:web && npm run start:dev',
      build: 'npm run build:clean && npm run build:web && npm run build:api',
      'build:clean': 'rm -rf dist',
      'build:web': 'cd src/web && tsc && vite build --outDir ../../dist',
      'build:api': 'tsc --project tsconfig.api.json',
      start: 'node -e "if(!require(\'fs\').existsSync(\'./dist/api/server.js\')){console.error(\'❌ Build required: run npm run build first\');process.exit(1)}" && node dist/api/server.js',
      'start:dev': 'NODE_ENV=development tsx src/api/server.ts',
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
    // Success is implied by the "Configuring fullstack integration" message
  } catch (error) {
    console.error(
      '❌ Error configuring fullstack integration:',
      error.message
    );
    throw error; // Re-throw to be caught by main try-catch
  }
}

if (!command) {
  console.log(`
🔥 Helix Framework - Fullstack Apps

Usage:
  helix create <project-name> [template]  Create new fullstack project
  helix create . [template]               Install in current directory

Templates:
  basicapp    Basic app with routing and features (default)
  welcomeapp  Landing page focused app (coming soon)
  userapp     User management app (coming soon)
  todoapp     Todo application (coming soon)

Examples:
  helix create my-app                    # Create basicapp in my-app/ directory
  helix create my-app basicapp           # Same as above
  helix create . basicapp                # Install basicapp in current directory
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

  // Validate template type
  const validTemplates = ['basicapp', 'welcomeapp', 'userapp', 'todoapp'];
  if (!validTemplates.includes(templateType)) {
    console.error(`❌ Invalid template "${templateType}". Available templates: ${validTemplates.join(', ')}`);
    process.exit(1);
  }

  // Check if template exists
  const templatePath = join(__dirname, '../templates', templateType);
  if (!existsSync(templatePath)) {
    console.error(`❌ Template "${templateType}" is not yet available. Currently available: basicapp`);
    process.exit(1);
  }

  const isCurrentDir = projectName === '.';

  if (isCurrentDir) {
    console.log(`🚀 Installing Helix ${templateType} in current directory`);

    // Check if current directory has package.json and warn about overwrite
    if (existsSync('./package.json')) {
      console.log('📦 Found existing package.json - will merge with Helix configuration');
    }
  } else {
    console.log(`🚀 Creating Helix ${templateType} project: ${projectName}`);

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
    console.log('📱 Setting up frontend (UIKit)...');

    // Install UIKit globally and create FBCA frontend (suppress output)
    execSync('npm install -g @voilajsx/uikit > /dev/null 2>&1 || npm install -g @voilajsx/uikit', { stdio: 'pipe' });
    execSync('uikit create . --fbca --theme base', { stdio: 'pipe' });

    console.log('🔧 Setting up backend (AppKit)...');

    // Install AppKit globally and create backend (suppress output)
    execSync('npm install -g @voilajsx/appkit > /dev/null 2>&1 || npm install -g @voilajsx/appkit', { stdio: 'pipe' });
    execSync('appkit generate app', { stdio: 'pipe' });

    console.log('🔄 Configuring fullstack integration...');

    // Now merge the Helix fullstack template with the generated package.json
    await mergeHelixPackageJson();

    console.log('🎉 Installing dependencies...');
    execSync('npm install', { stdio: 'pipe' });

    // Copy Helix template files to override UIKit defaults (after install)
    copyHelixTemplate(templateType);

    // Add VITE_API_URL to .env for frontend API configuration
    addViteApiUrl();

    if (isCurrentDir) {
      console.log(`
✅ Helix ${templateType} installed successfully!

🚀 Development:
  npm run dev          # Both API (3000) + Web (5173)
  npm run dev:api      # Backend only
  npm run dev:web      # Frontend only
  npm run dev:fullstack # Unified experience

💡 Run "npm run dev" to get started!
`);
    } else {
      console.log(`
✅ Helix ${templateType} project ${projectName} created successfully!

Next steps:
  cd ${projectName}
  npm run dev

🚀 Development options:
  npm run dev          # Both API (3000) + Web (5173)
  npm run dev:api      # Backend only
  npm run dev:web      # Frontend only
  npm run dev:fullstack # Unified experience
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
