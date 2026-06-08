import type { Plugin } from "@opencode-ai/plugin";
import { createAgents, getAgentConfigs } from "./agents";
import { loadConfig } from "./config/loader";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const REPO = "laobiao651/opencode-agent-swarm";
const CURRENT_VERSION = "1.1.2";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function getLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { headers: { "Accept": "application/vnd.github+json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    return data.tag_name?.replace(/^v/, "") ?? null;
  } catch {
    return null;
  }
}

async function checkForUpdate(): Promise<{
  update: string | null;
  current: string;
}> {
  const cacheFile = join(
    homedir(),
    ".config",
    "opencode",
    ".swarm-update-check"
  );
  const now = Date.now();

  if (existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, "utf-8"));
      if (now - cached.timestamp < CHECK_INTERVAL_MS) {
        return {
          update: cached.latest !== CURRENT_VERSION ? cached.latest : null,
          current: CURRENT_VERSION,
        };
      }
    } catch {
      /* stale */
    }
  }

  const latest = await getLatestVersion();
  try {
    mkdirSync(join(homedir(), ".config", "opencode"), { recursive: true });
    writeFileSync(cacheFile, JSON.stringify({ latest, timestamp: now }));
  } catch {
    /* best-effort */
  }

  return {
    update: latest && latest !== CURRENT_VERSION ? latest : null,
    current: CURRENT_VERSION,
  };
}

const AGENT_SWARM: Plugin = async (_ctx) => {
  const config = loadConfig();
  const agentDefs = createAgents(config);
  const agents = getAgentConfigs(agentDefs);

  return {
    name: "opencode-agent-swarm",
    agent: agents,

    config: async (opencodeConfig: Record<string, unknown>) => {
      // Fire-and-forget update check
      checkForUpdate()
        .then(({ update, current }) => {
          if (update) {
            console.error(
              `\n[opencode-agent-swarm] 🔔 新版本 v${update} 可用（当前 v${current}）\n` +
                `  升级: /swarm-update 或手动清除缓存后重启\n`
            );
          }
        })
        .catch(() => {});

      if (!(opencodeConfig as { default_agent?: string }).default_agent) {
        (opencodeConfig as { default_agent?: string }).default_agent =
          "task-build";
      }

      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agents };
      } else {
        const configAgent = opencodeConfig.agent as Record<string, unknown>;
        for (const [name, def] of Object.entries(agents)) {
          if (!configAgent[name]) {
            configAgent[name] = { ...(def as Record<string, unknown>) };
          }
        }
      }

      // Register commands
      if (!opencodeConfig.command) {
        opencodeConfig.command = {};
      }
      const cmd = opencodeConfig.command as Record<string, unknown>;

      if (!cmd["setup-swarm"]) {
        cmd["setup-swarm"] = {
          template:
            "帮我在本地完成 opencode-agent-swarm 插件的完整安装：1) 注册插件到 opencode.json 2) 拷贝提示词到 ~/.config/opencode/prompts/ 3) 拷贝技能到 ~/.config/opencode/skills/ 4) 生成默认模型配置文件 task-orchestration.json。所有操作都在本地执行，不修改远程仓库。",
          description:
            "一键安装/更新 opencode-agent-swarm 插件（提示词 + 技能 + 配置）",
        };
      }

      if (!cmd["swarm-update"]) {
        cmd["swarm-update"] = {
          template:
            "帮我升级 opencode-agent-swarm 插件到最新版本：1) 清除 OpenCode 插件缓存 ~/.cache/opencode/packages/opencode-agent-swarm 2) 运行 npx github:laobiao651/opencode-agent-swarm@main 重新安装提示词和技能 3) 确认 ~/.config/opencode/opencode.json 中版本号已更新",
          description: "升级 opencode-agent-swarm 到最新版本",
        };
      }
    },
  };
};

export default AGENT_SWARM;
