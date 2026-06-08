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
# 需要 Node.js ≥ 18 或 Bun
npx opencode-agent-swarm
```

安装后 OpenCode 会自动加载插件，`task-build` 成为默认 agent。

## 模型配置

编辑 `~/.config/opencode/task-orchestration.json`：

```jsonc
{
  "agents": {
    "task-build":      { "model": "google/gemini-3-pro-preview" },
    "code-fix":        { "model": "anthropic/claude-sonnet-4" },
    "reviewer":        { "model": "google/gemini-3.1-pro-preview", "variant": "high" }
    // 未列出的 agent 使用默认模型
  }
}
```

每个 agent 支持的可选字段：
- `model` — 模型 ID（如 `google/gemini-3-pro-preview`）
- `variant` — 模型变体（`high` / `medium` / `low`）
- `temperature` — 温度参数（0.0 ~ 1.0）

## 技能

| 技能 | 说明 | 授权代理 |
|---|---|---|
| `modular-reuse-design` | 模块化复用设计决策（三层扫描 + 五级决策） | task-build, planner |

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
