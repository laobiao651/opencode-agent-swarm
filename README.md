# opencode-agent-swarm

OpenCode 多智能体编排插件 —— 基于 Task Build 主代理调度的 9 智能体协作体系。

## 智能体阵容

| Agent | 角色 | 默认模型 |
|---|---|---|
| **task-build** | 主调度代理，架构侦察 + 方案制定 + 子代理派发 | deepseek-v4-pro |
| **code-fix** | 轻量实施，≤2 文件 ≤30 行 | gemini-3.5-flash |
| **code-full** | 复杂实施，跨模块/新功能/重构 | gemini-3-flash-preview |
| **planner** | 多步骤计划拆解 | gemini-3.1-pro-low |
| **reviewer** | 独立代码审查 | gemini-3.1-pro-preview |
| **librarian** | 外部文档/API 查询 | deepseek-v4-flash-free |
| **browser-agent** | 浏览器取证/E2E/性能诊断 | gemini-3-flash-preview |
| **bug-diagnoser** | Bug 根因诊断 | gemini-3.1-pro-preview |
| **ui-designer** | UI/UX 视觉与交互 | gemini-3.5-flash |

## 安装

```bash
npx github:laobiao651/opencode-agent-swarm
```

CLI 自动完成：
1. 安装 agent 定义到 `~/.config/opencode/agents/`
2. 安装技能到 `~/.config/opencode/skills/`
3. 安装全局规则到 `~/.config/opencode/AGENTS.md`
4. 生成默认模型配置 `~/.config/opencode/task-orchestration.json`

重启 OpenCode 后，`task-build` 成为默认 agent。

## 模型配置

编辑 `~/.config/opencode/task-orchestration.json`：

```jsonc
{
  "agents": {
    "task-build": { "model": "google/gemini-3-pro-preview" },
    "code-fix":   { "model": "anthropic/claude-sonnet-4" }
    // 未列出的 agent 使用 agent 文件中的默认模型
  }
}
```

每个 agent 可选字段：`model`、`variant`、`temperature`。

## 升级

```bash
npx github:laobiao651/opencode-agent-swarm
```

已编辑过的 agent 文件不会被覆盖，但会生成 `.latest` 副本供你对比：

```bash
diff ~/.config/opencode/agents/task-build.md ~/.config/opencode/agents/task-build.md.latest
```

## 技能

| 技能 | 说明 |
|---|---|
| `modular-reuse-design` | 模块化复用设计决策（三层扫描 + 五级决策） |

## 工作流

```
用户请求 → task-build（摸底 + 方案）
              ├── 轻 → 派 code-fix
              ├── 重 → 派 planner 出 plan → 派 code-full → 派 reviewer
              ├── 查 → 派 explore / librarian / browser-agent
              └── UI → 派 ui-designer
```

## License

MIT
