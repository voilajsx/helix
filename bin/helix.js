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
const verbose = process.argv.includes('--verbose');

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
function copyHelixTemplate(templateType, verbose = false) {
  try {
    const templatePath = join(__dirname, '../templates', templateType);
    if (verbose) console.log(`🔍 [DEBUG] Template path: ${templatePath}`);

    if (!existsSync(templatePath)) {
      console.error(`❌ Template "${templateType}" not found at ${templatePath}`);
      return;
    }

    let filesCopied = 0;

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
            if (verbose) console.log(`🔍 [DEBUG] Created directory: ${destItem}`);
          }
          copyRecursive(sourceItem, destItem);
        } else if (stat.isFile()) {
          // Skip package.json files to preserve merged version
          if (item === 'package.json' || item === 'package.json.template') {
            if (verbose) console.log(`🔍 [DEBUG] Skipped ${item} to preserve merged package.json`);
            return;
          }

          // Handle .template files
          if (item.endsWith('.template')) {
            const destItem = join(destPath, item.replace('.template', ''));
            copyFileSync(sourceItem, destItem);
            filesCopied++;
            if (verbose) console.log(`🔍 [DEBUG] Copied template file: ${item} -> ${item.replace('.template', '')}`);
          } else {
            const destItem = join(destPath, item);
            copyFileSync(sourceItem, destItem);
            filesCopied++;
            if (verbose) console.log(`🔍 [DEBUG] Copied file: ${item}`);
          }
        }
      }
    }

    copyRecursive(templatePath, './');
    console.log('📋 Applied Helix template files');
    if (verbose) console.log(`🔍 [DEBUG] Total files copied: ${filesCopied}`);

  } catch (error) {
    console.error('❌ Error copying template files:', error.message);
    if (verbose) console.error('🔍 [DEBUG] Full error:', error);
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
async function mergeHelixPackageJson(verbose = false) {
  try {
    if (verbose) console.log('🔍 [DEBUG] Starting package.json merge...');

    // Read existing package.json (created by UIKit/AppKit)
    if (verbose) console.log('🔍 [DEBUG] Reading existing package.json...');
    let existingPackage = JSON.parse(readFileSync('./package.json', 'utf8'));
    if (verbose) console.log('🔍 [DEBUG] Existing package name:', existingPackage.name);
    if (verbose) console.log('🔍 [DEBUG] Existing scripts:', Object.keys(existingPackage.scripts || {}));

    // Convert to ESM if needed
    existingPackage = convertToESM(existingPackage);
    if (verbose) console.log('🔍 [DEBUG] ESM conversion completed, type:', existingPackage.type);

    // Read Helix template package.json
    const templatePath = join(__dirname, '../templates/package.json');
    if (verbose) console.log('🔍 [DEBUG] Reading Helix template from:', templatePath);
    const helixTemplate = JSON.parse(readFileSync(templatePath, 'utf8'));
    if (verbose) console.log('🔍 [DEBUG] Template scripts:', Object.keys(helixTemplate.scripts || {}));
    if (verbose) console.log('🔍 [DEBUG] Template dependencies:', Object.keys(helixTemplate.dependencies || {}));

    // Ensure dependencies object exists
    if (!existingPackage.dependencies) existingPackage.dependencies = {};
    if (!existingPackage.devDependencies) existingPackage.devDependencies = {};

    // Merge missing dependencies
    let addedDeps = 0;
    for (const [dep, version] of Object.entries(
      helixTemplate.dependencies || {}
    )) {
      if (!existingPackage.dependencies[dep]) {
        existingPackage.dependencies[dep] = version;
        addedDeps++;
        if (verbose) console.log(`🔍 [DEBUG] Added dependency: ${dep}@${version}`);
      }
    }
    if (verbose) console.log(`🔍 [DEBUG] Added ${addedDeps} new dependencies`);

    // Merge missing devDependencies
    let addedDevDeps = 0;
    for (const [dep, version] of Object.entries(
      helixTemplate.devDependencies || {}
    )) {
      if (!existingPackage.devDependencies[dep]) {
        existingPackage.devDependencies[dep] = version;
        addedDevDeps++;
        if (verbose) console.log(`🔍 [DEBUG] Added devDependency: ${dep}@${version}`);
      }
    }
    if (verbose) console.log(`🔍 [DEBUG] Added ${addedDevDeps} new devDependencies`);

    // Ensure scripts object exists
    if (!existingPackage.scripts) existingPackage.scripts = {};

    // Add/override Helix scripts from template
    let addedScripts = 0;
    for (const [script, command] of Object.entries(helixTemplate.scripts || {})) {
      const wasOverride = !!existingPackage.scripts[script];
      existingPackage.scripts[script] = command;
      addedScripts++;
      if (verbose) console.log(`🔍 [DEBUG] ${wasOverride ? 'Overrode' : 'Added'} script: ${script}`);
    }
    if (verbose) console.log(`🔍 [DEBUG] Processed ${addedScripts} scripts`);

    // Update description to reflect fullstack nature
    existingPackage.description =
      'Full-stack FBCA application with UIKit frontend and AppKit backend';

    // Add Helix to keywords if not present
    if (!existingPackage.keywords) existingPackage.keywords = [];
    if (!existingPackage.keywords.includes('helix')) {
      existingPackage.keywords.push('helix');
    }

    // Write updated package.json
    if (verbose) console.log('🔍 [DEBUG] Writing updated package.json...');
    writeFileSync(
      './package.json',
      JSON.stringify(existingPackage, null, 2) + '\n'
    );
    if (verbose) console.log('🔍 [DEBUG] Package.json merge completed successfully');

    // Success is implied by the "Configuring fullstack integration" message
  } catch (error) {
    console.error(
      '❌ Error configuring fullstack integration:',
      error.message
    );
    if (verbose) console.error('🔍 [DEBUG] Full error:', error);
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
    if (verbose) console.log('🔍 [DEBUG] Running: npx @voilajsx/uikit@latest create . --fbca --theme base');

    // Use npx instead of global install to avoid npm conflicts
    execSync('npx @voilajsx/uikit@latest create . --fbca --theme base', { stdio: verbose ? 'inherit' : 'pipe' });
    if (verbose) console.log('🔍 [DEBUG] UIKit setup completed');

    console.log('🔧 Setting up backend (AppKit)...');
    if (verbose) console.log('🔍 [DEBUG] Running: npx @voilajsx/appkit@latest generate app');

    // Use npx instead of global install to avoid npm conflicts
    execSync('npx @voilajsx/appkit@latest generate app', { stdio: verbose ? 'inherit' : 'pipe' });
    if (verbose) console.log('🔍 [DEBUG] AppKit setup completed');

    console.log('🔄 Configuring fullstack integration...');

    // Now merge the Helix fullstack template with the generated package.json
    await mergeHelixPackageJson(verbose);

    console.log('🎉 Installing dependencies...');
    if (verbose) console.log('🔍 [DEBUG] Running: npm install');
    execSync('npm install', { stdio: verbose ? 'inherit' : 'pipe' });
    if (verbose) console.log('🔍 [DEBUG] Dependencies installed');

    // Copy Helix template files to override UIKit defaults (after install)
    if (verbose) console.log('🔍 [DEBUG] Copying Helix template files...');
    copyHelixTemplate(templateType, verbose);

    // Add VITE_API_URL to .env for frontend API configuration
    if (verbose) console.log('🔍 [DEBUG] Adding VITE_API_URL to .env...');
    addViteApiUrl();

    // Clean up unnecessary directories for basicapp
    if (templateType === 'basicapp') {
      if (verbose) console.log('🔍 [DEBUG] Cleaning up unnecessary directories...');
      try {
        if (existsSync('./src/utils') && readdirSync('./src/utils').length === 0) {
          execSync('rmdir src/utils', { stdio: 'pipe' });
          if (verbose) console.log('🔍 [DEBUG] Removed empty src/utils directory');
        }
      } catch (error) {
        // Ignore cleanup errors
        if (verbose) console.log('🔍 [DEBUG] Utils directory cleanup skipped:', error.message);
      }
    }

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
