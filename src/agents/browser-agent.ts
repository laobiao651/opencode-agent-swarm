import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createBrowserAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.["browser-agent"];

  return {
    name: "browser-agent",
    config: {
      description: "浏览器全能助手，通过 CDP 完成真实浏览器中的工作。",
      mode: "subagent",
      model: override?.model ?? "google/gemini-3-flash-preview",
      variant: override?.variant ?? undefined,
      temperature: override?.temperature ?? 0.1,
      steps: 30,
      permission: {
        skill: {
          "*": "deny",
          "executing-plans": "allow",
          "receiving-code-review": "allow",
          "verification-before-completion": "allow",
          "web-access": "allow",
        },
      },
      prompt: loadPrompt("browser-agent")
    },
  };
}