#!/usr/bin/env node
/**
 * Creates a new package from template
 * Usage: node scripts/create-package.mjs <name> [--framework=react|angular]
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'packages');

const args = process.argv.slice(2);
const name = args[0];
const frameworkArg = args.find((a) => a.startsWith('--framework='));
const framework = frameworkArg?.split('=')[1] || 'react';

if (!name) {
  console.error('Usage: node scripts/create-package.mjs <name> [--framework=react|angular]');
  console.error('Example: node scripts/create-package.mjs react-fsd-starter');
  process.exit(1);
}

const packageDir = join(PACKAGES_DIR, name);

if (existsSync(packageDir)) {
  console.error(`❌ Package ${name} already exists`);
  process.exit(1);
}

console.log(`\n📦 Creating package: ${name}`);
console.log(`   Framework: ${framework}`);

// Create directory structure
const dirs = [
  '',
  'src',
  'src/app',
  'src/shared',
  'src/shared/ui',
  'src/shared/lib',
  'src/shared/api',
  'tests',
  'tests/unit',
  'tests/e2e',
  '.github',
  '.github/workflows',
];

dirs.forEach((dir) => {
  mkdirSync(join(packageDir, dir), { recursive: true });
});

// Create package.json
const packageJson = {
  name: `@front-templates/${name}`,
  version: '0.1.0',
  private: true,
  type: 'module',
  scripts: {
    dev: framework === 'react' ? 'vite' : 'ng serve',
    build: framework === 'react' ? 'vite build' : 'ng build',
    preview: framework === 'react' ? 'vite preview' : 'ng serve --prod',
    lint: 'eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
    'lint:fix': 'eslint src --ext ts,tsx --fix',
    typecheck: 'tsc --noEmit',
    format: 'prettier --write "src/**/*.{ts,tsx,css,json}"',
    'format:check': 'prettier --check "src/**/*.{ts,tsx,css,json}"',
    test: 'vitest',
    'test:unit': 'vitest run',
    'test:e2e': 'playwright test',
    'test:coverage': 'vitest run --coverage',
  },
  engines: {
    node: '>=20.0.0',
    pnpm: '>=9.0.0',
  },
};

writeFileSync(join(packageDir, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n');

// Copy config templates
const templatesDir = join(ROOT, 'templates', 'configs');

// tsconfig
const tsconfigTemplate = readFileSync(
  join(templatesDir, 'tsconfig', `${framework}.tsconfig.json`),
  'utf-8'
);
writeFileSync(join(packageDir, 'tsconfig.json'), tsconfigTemplate);

// prettier
const prettierConfig = readFileSync(join(templatesDir, 'prettier', '.prettierrc.json'), 'utf-8');
writeFileSync(join(packageDir, '.prettierrc.json'), prettierConfig);

// CI workflow
const ciTemplate = readFileSync(join(templatesDir, 'ci', 'child-ci.yml'), 'utf-8');
writeFileSync(join(packageDir, '.github', 'workflows', 'ci.yml'), ciTemplate);

// Create README
const readme = `# ${name}

## Overview

TODO: Add description

## Quick Start

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Scripts

| Command | Description |
|---------|-------------|
| \`pnpm dev\` | Start development server |
| \`pnpm build\` | Build for production |
| \`pnpm test\` | Run tests |
| \`pnpm lint\` | Lint code |

## Structure

\`\`\`
src/
├── app/          # Application layer
├── pages/        # Page components
├── features/     # Feature modules
├── entities/     # Domain entities
└── shared/       # Shared code
\`\`\`
`;

writeFileSync(join(packageDir, 'README.md'), readme);

// Create .gitignore
const gitignore = `node_modules/
dist/
.turbo/
coverage/
*.local
.env
.env.*
!.env.example
`;

writeFileSync(join(packageDir, '.gitignore'), gitignore);

console.log(`\n✅ Package created: packages/${name}`);
console.log('\nNext steps:');
console.log(`  1. cd packages/${name}`);
console.log('  2. pnpm install');
console.log('  3. Start coding!\n');
