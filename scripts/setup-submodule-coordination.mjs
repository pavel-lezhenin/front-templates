#!/usr/bin/env node
/**
 * Configures repository dispatch webhook for submodule coordination
 * Usage: node scripts/setup-submodule-webhook.mjs
 */

import { execSync } from 'child_process';

const REPO_OWNER = 'pavel-lezhenin';
const PARENT_REPO = 'front-templates';
const SUBMODULE_REPOS = ['react-fsd-starter'];

function createWebhook(repo) {
  console.log(`🔗 Setting up webhook for ${REPO_OWNER}/${repo}`);

  const webhookConfig = {
    name: 'repository_dispatch',
    active: true,
    events: ['repository_dispatch'],
    config: {
      url: `https://api.github.com/repos/${REPO_OWNER}/${PARENT_REPO}/dispatches`,
      content_type: 'application/json',
    },
  };

  try {
    const configJson = JSON.stringify(webhookConfig);
    execSync(`gh api repos/${REPO_OWNER}/${repo}/hooks -X POST --input -`, {
      input: configJson,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    console.log(`✅ Webhook configured for ${repo}`);
  } catch (error) {
    console.error(`❌ Failed to configure webhook for ${repo}:`, error.message);
  }
}

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
