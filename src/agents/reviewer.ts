import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createReviewerAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.reviewer;

  return {
    name: "reviewer",
    config: {
      description: "负责独立代码审查，只读 diff 挑刺，不编写修复代码。",
      mode: "subagent",
      model: override?.model ?? "google/gemini-3.1-pro-preview",
      variant: override?.variant ?? "high",
      temperature: override?.temperature ?? 0.1,
      steps: 20,
      tools: {
        write: false,
        edit: false,
      },
      permission: {
        edit: "deny",
        bash: {
          "*": "deny",
          "git diff*": "allow",
          "git log*": "allow",
          "git show*": "allow",
          "git status*": "allow",
          "cat *": "allow",
          "ls *": "allow",
          "find *": "allow",
          "grep *": "allow",
          "rg *": "allow",
        },
        skill: {
          "*": "deny",
          "receiving-code-review": "allow",
          "verification-before-completion": "allow",
        },
      },
      prompt: loadPrompt("reviewer")
    },
  };
}
