import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const OPENCODE_DIR = join(homedir(), ".config", "opencode");
const CACHE_FILE = join(OPENCODE_DIR, ".agent-swarm-update");
const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

const DEFAULT_MODELS = {
  "task-build":      { model: "opencode-go/deepseek-v4-pro" },
  "code-fix":        { model: "google-agy/gemini-3.5-flash" },
  "code-full":       { model: "google/gemini-3-flash-preview" },
  "planner":         { model: "google-agy/gemini-3.1-pro-low" },
  "reviewer":        { model: "google/gemini-3.1-pro-preview" },
  "librarian":       { model: "opencode/deepseek-v4-flash-free" },
  "browser-agent":   { model: "google/gemini-3-flash-preview" },
  "bug-diagnoser":   { model: "google/gemini-3.1-pro-preview" },
  "ui-designer":     { model: "google-agy/gemini-3.5-flash" },
};

function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (!existsSync(d)) {
      cpSync(s, d);
    }
  }
}

function getCurrentVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
    return pkg.version;
  } catch { return "0.0.0"; }
}

async function checkUpdate() {
  // Read cache
  let cached = null;
  if (existsSync(CACHE_FILE)) {
    try { cached = JSON.parse(readFileSync(CACHE_FILE, "utf-8")); } catch {}
  }
  // Return cached if fresh
  if (cached && Date.now() - cached.time < CHECK_INTERVAL) {
    return cached;
  }

  try {
    const res = await fetch(
      "https://api.github.com/repos/laobiao651/opencode-agent-swarm/releases/latest",
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const latest = data.tag_name?.replace(/^v/, "");
    const result = { latest, time: Date.now() };
    try { writeFileSync(CACHE_FILE, JSON.stringify(result)); } catch {}
    return result;
  } catch { return null; }
}

export const AgentSwarmPlugin = async ({ client }) => {
  return {
    config: async (config) => {
      // 1. Copy agent .md files
      const agentsSrc = join(PKG_ROOT, "agents");
      if (existsSync(agentsSrc)) {
        copyDir(agentsSrc, join(OPENCODE_DIR, "agents"));
      }

      // 2. Copy skills
      const skillsSrc = join(PKG_ROOT, "skills");
      if (existsSync(skillsSrc)) {
        copyDir(skillsSrc, join(OPENCODE_DIR, "skills"));
      }

      // 3. Copy AGENTS.md
      const rulesSrc = join(PKG_ROOT, "AGENTS.md");
      const rulesDst = join(OPENCODE_DIR, "AGENTS.md");
      if (!existsSync(rulesDst) && existsSync(rulesSrc)) {
        cpSync(rulesSrc, rulesDst);
      }

      // 4. Generate default task-orchestration.json
      const configDst = join(OPENCODE_DIR, "task-orchestration.json");
      if (!existsSync(configDst)) {
        writeFileSync(configDst, JSON.stringify({ agents: DEFAULT_MODELS }, null, 2));
      }

      // 5. Read user's model config and apply overrides
      if (existsSync(configDst)) {
        try {
          const userConfig = JSON.parse(readFileSync(configDst, "utf-8"));
          config.agent = config.agent || {};
          for (const [name, override] of Object.entries(userConfig.agents || {})) {
            if (override.model || override.variant || override.temperature !== undefined) {
              config.agent[name] = config.agent[name] || {};
              if (override.model) config.agent[name].model = override.model;
              if (override.variant) config.agent[name].variant = override.variant;
              if (override.temperature !== undefined) config.agent[name].temperature = override.temperature;
            }
          }
        } catch {}
      }

      // 6. Set default agent
      if (!config.default_agent) {
        config.default_agent = "task-build";
      }

      // 7. Check for updates (fire-and-forget)
      const current = getCurrentVersion();
      checkUpdate().then((info) => {
        if (info?.latest && info.latest !== current) {
          console.error(
            `\n[agent-swarm] 🔔 新版本 v${info.latest} 可用（当前 v${current}）\n` +
            `  升级方法：删除 ~/.cache/opencode/packages/opencode-agent-swarm@git+https: 后重启 OpenCode\n`
          );
        }
      }).catch(() => {});
    }
  };
};
