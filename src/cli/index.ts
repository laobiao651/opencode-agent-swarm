#!/usr/bin/env node

import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Path resolution: when installed via npm, skills live next to the compiled
// CLI at ../../../src/skills (relative to dist/cli/index.js).
// During development with tsx, hit src/skills directly.
function resolveSkillsSrc(): string {
  const candidate = join(__dirname, "..", "..", "src", "skills");
  return candidate;
}

const OPENCODE_DIR = join(homedir(), ".config", "opencode");
const CONFIG_KEY = "opencode-agent-swarm";

// ─── Default model configuration ──────────────────────────────────────
const DEFAULT_CONFIG = {
  agents: {
    "task-build":      { "model": "opencode-go/deepseek-v4-pro" },
    "code-fix":        { "model": "google-agy/gemini-3.5-flash" },
    "code-full":       { "model": "google/gemini-3-flash-preview" },
    "planner":         { "model": "google-agy/gemini-3.1-pro-low" },
    "reviewer":        { "model": "google/gemini-3.1-pro-preview" },
    "librarian":       { "model": "opencode/deepseek-v4-flash-free" },
    "browser-agent":   { "model": "google/gemini-3-flash-preview" },
    "bug-diagnoser":   { "model": "google/gemini-3.1-pro-preview" },
    "ui-designer":     { "model": "google-agy/gemini-3.5-flash" },
  },
};

// ─── Step 1: Copy skills ──────────────────────────────────────────────
function installSkills(): void {
  const src = resolveSkillsSrc();
  const dest = join(OPENCODE_DIR, "skills");

  if (!existsSync(src)) {
    console.warn(`[opencode-agent-swarm] Skills 源目录不存在: ${src}`);
    return;
  }

  mkdirSync(dest, { recursive: true });

  // Copy each skill directory
  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const srcDir = join(src, entry.name);
      const destDir = join(dest, entry.name);
      cpSync(srcDir, destDir, { recursive: true });
      console.log(`  📋 技能已安装: skills/${entry.name}`);
    }
  }
}


// ─── Step 2: Install prompts ─────────────────────────────────────────
function resolvePromptsSrc(): string {
  // From dist/cli/index.js → ../../assets/prompts
  return join(__dirname, "..", "..", "assets", "prompts");
}

function installPrompts(): void {
  const src = resolvePromptsSrc();
  const dest = join(OPENCODE_DIR, "prompts");

  if (!existsSync(src)) {
    console.warn(`[opencode-agent-swarm] Prompts 源目录不存在: ${src}`);
    return;
  }

  mkdirSync(dest, { recursive: true });

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcFile = join(src, entry);
    const destFile = join(dest, entry);

    if (!existsSync(destFile)) {
      // First install → copy directly
      cpSync(srcFile, destFile);
    } else {
      // Already exists → save new version as .default for user reference
      cpSync(srcFile, destFile + ".default");
    }
  }
  console.log(`  📝 提示词已安装: prompts/ (${entries.length} 个文件)`);
}

// ─── Step 3: Register plugin in opencode.json ─────────────────────────
function registerPlugin(): void {
  const configPath = join(OPENCODE_DIR, "opencode.json");
  mkdirSync(OPENCODE_DIR, { recursive: true });

  let cfg: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      cfg = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      console.warn("[opencode-agent-swarm] opencode.json 解析失败，将重新创建");
    }
  }

  const PLUGIN_ENTRY = "opencode-agent-swarm@git+https://github.com/laobiao651/opencode-agent-swarm.git";

  // Ensure plugin is an array
  if (!cfg.plugin || !Array.isArray(cfg.plugin)) {
    cfg.plugin = [];
  }
  const plugins = cfg.plugin as string[];

  // Only add if not already present
  if (!plugins.includes(PLUGIN_ENTRY)) {
    plugins.push(PLUGIN_ENTRY);
    writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    console.log("  🔌 插件已注册到 opencode.json");
  } else {
    console.log("  ⏭️  插件已注册，跳过");
  }
}

// ─── Step 4: Generate default config ──────────────────────────────────
function generateDefaultConfig(): void {
  const configPath = join(OPENCODE_DIR, "task-orchestration.json");

  if (existsSync(configPath)) {
    console.log("  ⏭️  配置文件已存在，跳过: task-orchestration.json");
    return;
  }

  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  console.log("  ⚙️  已生成默认配置: task-orchestration.json");
}

// ─── Main ─────────────────────────────────────────────────────────────
function main() {
  console.log("\n🚀 opencode-agent-swarm 安装程序\n");

  try {
    // Existing steps
    installSkills();
    installPrompts();
    registerPlugin();
    generateDefaultConfig();
  } catch (err) {
    console.error(`\n❌ 安装失败: ${String(err)}`);
    process.exit(1);
  }

  console.log("\n✅ 安装完成！");
  console.log("   提示词目录: ~/.config/opencode/prompts/");
  console.log("   模型配置:   ~/.config/opencode/task-orchestration.json");
  console.log("   OpenCode 下次启动时 task-build 将成为默认 agent。\n");
}

main();
