import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createPlannerAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.planner;

  return {
    name: "planner",
    config: {
      description: "负责制定可执行的实施计划，不编写实现代码。",
      mode: "subagent",
      model: override?.model ?? "google-agy/gemini-3.1-pro-low",
      variant: override?.variant ?? "medium",
      temperature: override?.temperature ?? 0.2,
      steps: 25,
      permission: {
        bash: "deny",
        edit: {
          "*": "deny",
          "docs/plans/**/*.md": "allow",
          "docs/plans/*.md": "allow",
          "docs/superpowers/plans/**/*.md": "allow",
          "docs/superpowers/plans/*.md": "allow",
          ".opencode/plans/**/*.md": "allow",
          ".opencode/plans/*.md": "allow",
        },
        skill: {
          "*": "deny",
          "verification-before-completion": "allow",
          "modular-reuse-design": "allow",
        },
      },
      prompt: loadPrompt("planner")
    },
  };
}
