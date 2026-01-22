#!/usr/bin/env node
/**
 * Adds a new git submodule
 * Usage: pnpm submodule:add <git-url> <package-name>
 */

import { execSync } from 'child_process';

const args = process.argv.slice(2);
const url = args[0];
const name = args[1];

if (!url || !name) {
  console.error('Usage: pnpm submodule:add <git-url> <package-name>');
  console.error('Example: pnpm submodule:add https://github.com/org/react-fsd-starter react-fsd-starter');
  process.exit(1);
}

console.log(`\n📦 Adding submodule: ${name}`);
console.log(`   URL: ${url}\n`);

try {
  execSync(`git submodule add ${url} packages/${name}`, { stdio: 'inherit' });
  execSync('git submodule update --init --recursive', { stdio: 'inherit' });
  console.log(`\n✅ Submodule added: packages/${name}`);
} catch (error) {
  console.error('\n❌ Failed to add submodule');
  process.exit(1);
}
