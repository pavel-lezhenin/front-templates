#!/usr/bin/env node
/**
 * Checks if current branch is main/master and blocks commits
 * Used in pre-commit hook
 */

import { execSync } from 'child_process';
import { exit } from 'process';

const PROTECTED_BRANCHES = ['main', 'master'];

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf-8',
  }).trim();

  if (PROTECTED_BRANCHES.includes(branch)) {
    console.error('\n❌ Direct commits to', branch, 'branch are not allowed!');
    console.error('\nPlease create a feature branch:');
    console.error('  git checkout -b feature/<your-feature-name>\n');
    exit(1);
  }
} catch (error) {
  // Not a git repo or git not available
  console.warn('⚠️  Could not determine git branch');
}
