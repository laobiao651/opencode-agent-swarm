import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

/**
 * Resolve the packaged prompts directory (assets/prompts/ inside the npm package).
 * Uses import.meta.url to find the package root at runtime.
 */
function getPackagedPromptsDir(): string {
  try {
    // dist/index.js → go up to package root → assets/prompts/
    const distDir = dirname(fileURLToPath(import.meta.url));
    return join(distDir, "..", "assets", "prompts");
  } catch {
    return "";
  }
}

const USER_PROMPTS_DIR = join(homedir(), ".config", "opencode", "prompts");
const PACKAGED_PROMPTS_DIR = getPackagedPromptsDir();

/**
 * Load a raw prompt file. Resolution order:
 * 1. User-customized: ~/.config/opencode/prompts/{name}.md
 * 2. Bundled default: assets/prompts/{name}.md (inside npm package)
 *
 * Throws if neither source is found.
 */
function loadRawPrompt(name: string): string {
  // 1. User-customized or CLI-installed version
  const userPath = join(USER_PROMPTS_DIR, `${name}.md`);
  if (existsSync(userPath)) {
    return readFileSync(userPath, "utf-8");
  }

  // 2. Bundled default from npm package
  if (PACKAGED_PROMPTS_DIR) {
    const packagedPath = join(PACKAGED_PROMPTS_DIR, `${name}.md`);
    if (existsSync(packagedPath)) {
      return readFileSync(packagedPath, "utf-8");
    }
  }

  throw new Error(
    `Prompt "${name}.md" 未找到。` +
    `请运行 'npx opencode-agent-swarm install' 安装提示词文件，` +
    `或手动放置到 ${USER_PROMPTS_DIR}/${name}.md`
  );
}

/**
 * Load the complete prompt for an agent by combining:
 * Global rules (_global.md) + agent-specific prompt.
 */
export function loadPrompt(name: string): string {
  const global = loadRawPrompt("_global");
  const specific = loadRawPrompt(name);
  return global + "\n\n" + specific;
}
