import type { PluginConfig } from "../config/loader";

import { createTaskBuildAgent } from "./task-build";
import { createCodeFixAgent } from "./code-fix";
import { createCodeFullAgent } from "./code-full";
import { createPlannerAgent } from "./planner";
import { createReviewerAgent } from "./reviewer";
import { createLibrarianAgent } from "./librarian";
import { createBrowserAgent } from "./browser-agent";
import { createBugDiagnoser } from "./bug-diagnoser";
import { createUiDesigner } from "./ui-designer";

/** Factory function signature shared by all agent creators. */
type AgentFactory = (config: PluginConfig) => {
  name: string;
  config: Record<string, unknown>;
};

/**
 * Ordered list of agent factories. Order matters:
 * task-build (primary) must come first so it becomes the default agent
 * if no default_agent is explicitly set.
 */
const FACTORIES: AgentFactory[] = [
  createTaskBuildAgent,
  createCodeFixAgent,
  createCodeFullAgent,
  createPlannerAgent,
  createReviewerAgent,
  createLibrarianAgent,
  createBrowserAgent,
  createBugDiagnoser,
  createUiDesigner,
];

/**
 * Create all agent definitions from the current plugin configuration.
 * Each agent's model/variant/temperature can be overridden via
 * `~/.config/opencode/task-orchestration.json`.
 */
export function createAgents(config: PluginConfig) {
  return FACTORIES.map((factory) => factory(config));
}

/**
 * Convert an array of agent definitions into the `Record<string, AgentConfig>`
 * format expected by the OpenCode Plugin SDK's `agent` field.
 */
export function getAgentConfigs(
  agents: ReturnType<typeof createAgents>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const agent of agents) {
    result[agent.name] = agent.config;
  }
  return result;
}
