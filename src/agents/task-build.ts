import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createTaskBuildAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.["task-build"];

  return {
    name: "task-build",
    config: {
      description: "主调度代理，负责任务拆解、方案设计与子代理调度。不能直接写代码。",
      mode: "primary" as const,
      model: override?.model ?? "opencode-go/deepseek-v4-pro",
      variant: override?.variant ?? undefined,
      temperature: override?.temperature ?? 0.2,
      steps: override?.steps ?? 80,
      tools: { write: false, edit: false },
      permission: {
        bash: {
          "ls *": "allow",
          "cat *": "allow",
          "grep *": "allow",
          "find *": "allow",
          "rg *": "allow",
          "git status*": "allow",
          "git log*": "allow",
          "git diff*": "allow",
          "*": "ask",
        },
        task: {
          "*": "deny",
          "explore": "allow",
          "librarian": "allow",
          "planner": "allow",
          "code-fix": "allow",
          "code-full": "allow",
          "ui-designer": "allow",
          "browser-agent": "allow",
          "reviewer": "allow",
          "bug-diagnoser": "ask",
        },
        skill: {
          "*": "deny",
          "modular-reuse-design": "allow",
        },
      },
      prompt: loadPrompt("task-build")
    }
  };
}
