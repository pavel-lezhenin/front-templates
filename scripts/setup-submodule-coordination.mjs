#!/usr/bin/env node
/**
 * Configures repository dispatch webhook for submodule coordination
 * Usage: node scripts/setup-submodule-webhook.mjs
 */

import { execSync } from 'child_process';

const REPO_OWNER = 'pavel-lezhenin';
const SUBMODULE_REPOS = ['react-fsd-starter'];

function checkSubmoduleCI(repo) {
  console.log(`🔍 Checking CI configuration for ${REPO_OWNER}/${repo}`);

  try {
    // Check if .github/workflows/ci.yml exists
    const result = execSync(
      `gh api repos/${REPO_OWNER}/${repo}/contents/.github/workflows/ci.yml`,
      {
        stdio: 'pipe',
      }
    ).toString();

    const file = JSON.parse(result);
    console.log(`✅ CI workflow exists: ${file.name}`);

    // Check for repository_dispatch trigger
    const content = Buffer.from(file.content, 'base64').toString();
    if (content.includes('repository_dispatch')) {
      console.log(`✅ Repository dispatch trigger configured`);
    } else {
      console.log(`⚠️  Repository dispatch trigger missing in ${repo}`);
    }
  } catch (error) {
    console.error(`❌ CI check failed for ${repo}:`, error.message);
  }
}

function main() {
  console.log('🚀 Setting up submodule coordination...\n');

  for (const repo of SUBMODULE_REPOS) {
    checkSubmoduleCI(repo);
    console.log('');
  }

  console.log('📋 Manual steps needed:');
  console.log('1. Ensure GH_PAT secret is configured with proper permissions');
  console.log('2. Test workflow trigger with a feature branch push');
  console.log('3. Verify submodule CI gets triggered automatically');
}

main();
