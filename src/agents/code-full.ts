import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createCodeFullAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.["code-full"];

  return {
    name: "code-full",
    config: {
      description: "复杂实施代理，负责跨模块改动、新功能开发、重构及数据库变更。",
      mode: "subagent" as const,
      model: override?.model ?? "google/gemini-3-flash-preview",
      variant: override?.variant ?? "medium",
      temperature: override?.temperature ?? 0.3,
      steps: override?.steps ?? 50,
      permission: {
        skill: {
          "*": "deny",
          "executing-plans": "allow",
          "receiving-code-review": "allow",
          "systematic-debugging": "allow",
          "test-driven-development": "allow",
          "verification-before-completion": "allow",
          "using-git-worktrees": "allow",
        },
      },
      prompt: loadPrompt("code-full")
    }
  };
}
