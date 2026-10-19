// Copies the project skills that non-Claude agents (Antigravity) may use from .claude/skills
// into .agents/skills, the folder Antigravity reads. Re-run after changing a listed skill.
// Curriculum and marketing skills are left out on purpose: that work belongs to Claude (AGENTS.md section 2).
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const SKILLS = [
  'brainstorming', 'writing-plans', 'executing-plans', 'verification-before-completion',
  'impeccable', 'taste-skill', 'soft-skill', 'minimalist-skill', 'redesign-skill', 'frontend-design',
  'apple-design', 'animate', 'review-animations', 'improve-animations', 'find-animation-opportunities',
  'animation-performance', 'emil-design-eng', 'mobile-native', 'break-ui',
  'humanizer', 'copywriting', 'copy-editing',
  'onboarding', 'churn-prevention', 'cro', 'signup', 'emails',
  'new-migration',
  'seo', 'seo-page', 'seo-technical', 'seo-schema', 'seo-hreflang', 'seo-images', 'ai-seo',
  'webapp-testing', 'test-guard', 'clean-code-guard', 'docs-guard',
];

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const from = path.join(root, '.claude', 'skills');
const to = path.join(root, '.agents', 'skills');

const missing = SKILLS.filter((name) => !existsSync(path.join(from, name, 'SKILL.md')));
if (missing.length) {
  console.error(`Missing in .claude/skills: ${missing.join(', ')}`);
  process.exit(1);
}

for (const name of SKILLS) {
  const dest = path.join(to, name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(path.join(from, name), dest, { recursive: true });
}
console.log(`Synced ${SKILLS.length} skills into .agents/skills`);
