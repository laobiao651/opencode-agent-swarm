import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createBugDiagnoser(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.["bug-diagnoser"];

  return {
    name: "bug-diagnoser",
    config: {
      description: "Bug 诊断专家，只诊断不修代码。",
      mode: "subagent",
      model: override?.model ?? "google/gemini-3.1-pro-preview",
      variant: override?.variant ?? undefined,
      reasoningEffort: "high",
      temperature: override?.temperature ?? 0.2,
      steps: 40,
      hidden: true,
      permission: {
        edit: "deny",
        skill: {
          "*": "deny",
          "systematic-debugging": "allow",
          "receiving-code-review": "allow",
          "verification-before-completion": "allow",
        },
      },
      prompt: loadPrompt("bug-diagnoser")
    },
  };
}