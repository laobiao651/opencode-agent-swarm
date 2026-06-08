#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const PKG_ROOT = path.resolve(__dirname, "..");
const OPENCODE_DIR = path.join(os.homedir(), ".config", "opencode");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      if (fs.existsSync(d)) {
        // Write .latest copy for user reference
        fs.cpSync(s, d + ".latest");
      } else {
        fs.cpSync(s, d);
        console.log(`  ✅ ${path.relative(OPENCODE_DIR, d)}`);
      }
    }
  }
}

console.log("\n🚀 opencode-agent-swarm 安装\n");

// 1. Install agents
const agentsSrc = path.join(PKG_ROOT, "agents");
const agentsDst = path.join(OPENCODE_DIR, "agents");
if (fs.existsSync(agentsSrc)) {
  copyDir(agentsSrc, agentsDst);
}

// 2. Install skills
const skillsSrc = path.join(PKG_ROOT, "skills");
const skillsDst = path.join(OPENCODE_DIR, "skills");
if (fs.existsSync(skillsSrc)) {
  copyDir(skillsSrc, skillsDst);
}

// 3. Install AGENTS.md
const globalRulesSrc = path.join(PKG_ROOT, "AGENTS.md");
const globalRulesDst = path.join(OPENCODE_DIR, "AGENTS.md");
if (!fs.existsSync(globalRulesDst)) {
  fs.cpSync(globalRulesSrc, globalRulesDst);
  console.log("  ✅ AGENTS.md");
} else {
  fs.cpSync(globalRulesSrc, globalRulesDst + ".latest");
  console.log("  📝 AGENTS.md.latest (已存在，写入 .latest 供对比)");
}

// 4. Generate model config
const configDst = path.join(OPENCODE_DIR, "task-orchestration.json");
if (!fs.existsSync(configDst)) {
  const configSrc = path.join(PKG_ROOT, "task-orchestration.json");
  fs.cpSync(configSrc, configDst);
  console.log("  ✅ task-orchestration.json");
} else {
  console.log("  ⏭️  task-orchestration.json (已存在，跳过)");
}

console.log("\n✅ 安装完成！重启 OpenCode 后生效。\n");
