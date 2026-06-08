import type { PluginConfig, AgentOverride } from "../config/loader";
import { loadPrompt } from "../prompts/loader";

export function createLibrarianAgent(config: PluginConfig) {
  const override: AgentOverride | undefined = config.agents?.librarian;

  return {
    name: "librarian",
    config: {
      description: "负责万能知识库与资料查询，提供权威来源验证。",
      mode: "subagent",
      model: override?.model ?? "opencode/deepseek-v4-flash-free",
      variant: override?.variant ?? "medium",
      temperature: override?.temperature ?? 0.1,
      steps: 15,
      tools: {
        write: false,
        edit: false,
        webfetch: true,
      },
      permission: {
        bash: "deny",
        skill: {
          "*": "deny",
          "verification-before-completion": "allow",
        },
      },
      prompt: loadPrompt("librarian")
    },
  };
}
