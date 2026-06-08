import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createCodeFixAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.["code-fix"];

  return {
    name: "code-fix",
    config: {
      description: "轻量级代码修复代理，负责小范围、定位明确的改动（≤2文件且≤30行）。",
      mode: "subagent" as const,
      model: override?.model ?? "google-agy/gemini-3.5-flash",
      variant: override?.variant ?? "medium",
      temperature: override?.temperature ?? 0.2,
      steps: override?.steps ?? 25,
      permission: {
        skill: {
          "*": "deny",
          "executing-plans": "allow",
          "receiving-code-review": "allow",
          "test-driven-development": "allow",
          "verification-before-completion": "allow",
          "using-git-worktrees": "allow",
        },
      },
      prompt: loadPrompt("code-fix")
    }
  };
}
