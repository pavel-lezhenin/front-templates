#!/usr/bin/env node
/**
 * Automatically configures branch protection rules for main branch
 * Usage: node scripts/setup-branch-protection.mjs
 */

import { execSync } from 'child_process';

const REPO_OWNER = 'pavel-lezhenin';
const REPO_NAME = 'front-templates';
const SUBMODULE_REPOS = ['react-fsd-starter'];

const PROTECTION_CONFIG = {
  required_status_checks: {
    strict: true,
    checks: [
      { context: 'security' },
      { context: 'lint' },
      { context: 'test-unit' },
      { context: 'build' },
    ],
  },
  enforce_admins: false,
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
  },
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
};

function setupBranchProtection(owner, repo) {
  console.log(`🔒 Setting up branch protection for ${owner}/${repo}`);

  try {
    const configJson = JSON.stringify(PROTECTION_CONFIG);
    const command = `gh api repos/${owner}/${repo}/branches/main/protection -X PUT --input -`;

    execSync(command, {
      input: configJson,
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    console.log(`✅ Branch protection configured for ${owner}/${repo}`);
  } catch (error) {
    console.error(`❌ Failed to configure ${owner}/${repo}:`, error.message);
  }
}

function main() {
  console.log('🚀 Configuring branch protection rules...\n');

  // Main repository
  setupBranchProtection(REPO_OWNER, REPO_NAME);

  // Submodule repositories
  for (const submodule of SUBMODULE_REPOS) {
    setupBranchProtection(REPO_OWNER, submodule);
  }

  console.log('\n📋 Next steps:');
  console.log('1. Verify protection rules in GitHub UI');
  console.log('2. Create feature branch for future work');
  console.log('3. Test PR workflow');
}

main();
