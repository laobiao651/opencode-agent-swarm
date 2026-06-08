import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const OPENCODE_DIR = join(homedir(), ".config", "opencode");

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

function copyNewFiles(srcDir, dstDir) {
  mkdirSync(dstDir, { recursive: true });
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyNewFiles(src, dst);
    } else if (!existsSync(dst)) {
      cpSync(src, dst);
    }
  }
}

export const AgentSwarmPlugin = async () => {
  return {
    "installation.updated": async () => {
      // 1. Install agents
      const agentsSrc = join(PKG_ROOT, "agents");
      if (existsSync(agentsSrc)) {
        copyNewFiles(agentsSrc, join(OPENCODE_DIR, "agents"));
      }

      // 2. Install skills
      const skillsSrc = join(PKG_ROOT, "skills");
      if (existsSync(skillsSrc)) {
        copyNewFiles(skillsSrc, join(OPENCODE_DIR, "skills"));
      }

      // 3. Install AGENTS.md
      const rulesSrc = join(PKG_ROOT, "AGENTS.md");
      const rulesDst = join(OPENCODE_DIR, "AGENTS.md");
      if (!existsSync(rulesDst) && existsSync(rulesSrc)) {
        cpSync(rulesSrc, rulesDst);
      }

      // 4. Generate default model config
      const configDst = join(OPENCODE_DIR, "task-orchestration.json");
      if (!existsSync(configDst)) {
        writeFileSync(configDst, JSON.stringify({ agents: DEFAULT_MODELS }, null, 2));
      }

      // 5. Set task-build as default agent
      const opencodeJson = join(OPENCODE_DIR, "opencode.json");
      let cfg = {};
      if (existsSync(opencodeJson)) {
        try { cfg = JSON.parse(readFileSync(opencodeJson, "utf-8")); } catch {}
      }
      if (!cfg.default_agent) {
        cfg.default_agent = "task-build";
        writeFileSync(opencodeJson, JSON.stringify(cfg, null, 2));
      }
    }
  };
};
