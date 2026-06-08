import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createUiDesigner(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.["ui-designer"];

  return {
    name: "ui-designer",
    config: {
      description: "UI/UX 专家，只做视觉与交互体验。",
      mode: "subagent",
      model: override?.model ?? "google-agy/gemini-3.5-flash",
      variant: override?.variant ?? "medium",
      temperature: override?.temperature ?? 0.5,
      steps: 30,
      permission: {
        skill: {
          "*": "deny",
          "executing-plans": "allow",
          "receiving-code-review": "allow",
          "verification-before-completion": "allow",
          "using-git-worktrees": "allow",
          "web-access": "allow",
          "ui-ux-pro-max": "allow",
        },
      },
      prompt: loadPrompt("ui-designer")
    },
  };
}