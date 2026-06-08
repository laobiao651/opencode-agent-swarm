import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const OPENCODE_DIR = join(homedir(), ".config", "opencode");
const CONFIG_FILE = "task-orchestration.json";

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

export const AgentSwarmPlugin = async () => {
  return {
    config: async (config) => {
      // 1. Copy agent .md files to ~/.config/opencode/agents/
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
      const configDst = join(OPENCODE_DIR, CONFIG_FILE);
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
    }
  };
};
