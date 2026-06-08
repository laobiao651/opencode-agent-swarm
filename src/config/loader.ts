import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface AgentOverride {
  /** 模型 ID，如 "google/gemini-3-pro-preview" */
  model?: string;
  /** 模型变体，如 "high" / "medium" / "low" */
  variant?: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大步数 */
  steps?: number;
}

export interface PluginConfig {
  /** 按 agent 名称的模型覆盖 */
  agents?: Record<string, AgentOverride>;
}

const DEFAULT_CONFIG = "task-orchestration.json";

/**
 * 从 ~/.config/opencode/task-orchestration.json 加载用户配置。
 * 文件不存在时返回空对象，各 agent 工厂使用内置默认模型。
 */
export function loadConfig(): PluginConfig {
  const configPath = join(homedir(), ".config", "opencode", DEFAULT_CONFIG);
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, "utf-8");
      return JSON.parse(raw) as PluginConfig;
    } catch {
      console.error(`[opencode-agent-swarm] 配置文件解析失败: ${configPath}`);
      return {};
    }
  }
  return {};
}

/**
 * 获取指定 agent 的覆盖配置，不存在返回 undefined。
 */
export function getAgentOverride(
  config: PluginConfig,
  agentName: string,
): AgentOverride | undefined {
  return config.agents?.[agentName];
}