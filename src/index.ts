import type { Plugin } from "@opencode-ai/plugin";
import { createAgents, getAgentConfigs } from "./agents";
import { loadConfig } from "./config/loader";

const OPENCODE_AGENT_SWARM: Plugin = async (_ctx) => {
  // Load user's model override config
  const config = loadConfig();

  // Create agent definitions with user overrides applied
  const agentDefs = createAgents(config);
  const agents = getAgentConfigs(agentDefs);

  return {
    name: "opencode-agent-swarm",

    // Register all agents with OpenCode
    agent: agents,

    // Config hook: merge agent configs and set default_agent
    config: async (opencodeConfig: Record<string, unknown>) => {
      // Set task-build as the default agent if none is configured
      if (!(opencodeConfig as { default_agent?: string }).default_agent) {
        (opencodeConfig as { default_agent?: string }).default_agent =
          "task-build";
      }

      // Merge agent configs from plugin into opencodeConfig
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agents };
      } else {
        const configAgent = opencodeConfig.agent as Record<string, unknown>;
        for (const [name, def] of Object.entries(agents)) {
          if (!configAgent[name]) {
            configAgent[name] = { ...(def as Record<string, unknown>) };
          }
        }
      }
    },
  };
};

export default OPENCODE_AGENT_SWARM;
