import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const OPENCODE_DIR = join(homedir(), ".config", "opencode");

export const AgentSwarmPlugin = async ({ client }) => {
  return {
    config: async (config) => {
      try {
        // 1. Copy agent .md files to ~/.config/opencode/agents/
        const agentsSrc = join(PKG_ROOT, "agents");
        const agentsDst = join(OPENCODE_DIR, "agents");
        if (existsSync(agentsSrc)) {
          mkdirSync(agentsDst, { recursive: true });
          for (const f of readdirSync(agentsSrc)) {
            const dst = join(agentsDst, f);
            if (!existsSync(dst)) {
              cpSync(join(agentsSrc, f), dst);
            }
          }
        }

        // 2. Copy skills
        const skillsSrc = join(PKG_ROOT, "skills");
        if (existsSync(skillsSrc)) {
          const skillsDst = join(OPENCODE_DIR, "skills");
          copyDir(skillsSrc, skillsDst);
        }

        // 3. Copy AGENTS.md
        const rulesSrc = join(PKG_ROOT, "AGENTS.md");
        const rulesDst = join(OPENCODE_DIR, "AGENTS.md");
        if (!existsSync(rulesDst) && existsSync(rulesSrc)) {
          cpSync(rulesSrc, rulesDst);
        }

        // 4. Generate task-orchestration.json
        const configDst = join(OPENCODE_DIR, "task-orchestration.json");
        if (!existsSync(configDst)) {
          writeFileSync(configDst, JSON.stringify({
            agents: {
              "task-build":      { model: "opencode-go/deepseek-v4-pro" },
              "code-fix":        { model: "google-agy/gemini-3.5-flash" },
              "code-full":       { model: "google/gemini-3-flash-preview" },
              "planner":         { model: "google-agy/gemini-3.1-pro-low" },
              "reviewer":        { model: "google/gemini-3.1-pro-preview" },
              "librarian":       { model: "opencode/deepseek-v4-flash-free" },
              "browser-agent":   { model: "google/gemini-3-flash-preview" },
              "bug-diagnoser":   { model: "google/gemini-3.1-pro-preview" },
              "ui-designer":     { model: "google-agy/gemini-3.5-flash" },
            }
          }, null, 2));
        }

        // 5. Set default agent
        if (!config.default_agent) {
          config.default_agent = "task-build";
        }
      } catch (err) {
        if (client?.app?.log) {
          await client.app.log({ body: { service: "agent-swarm", level: "error", message: String(err) } });
        }
      }
    }
  };
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
