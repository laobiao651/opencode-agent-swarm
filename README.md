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

### 前置条件

- [OpenCode](https://opencode.ai) 已安装
- Node.js ≥ 18

### 安装步骤

编辑 `~/.config/opencode/opencode.json`，在 `plugin` 数组中添加：

```jsonc
{
  "plugin": [
    "opencode-agent-swarm@git+https://github.com/laobiao651/opencode-agent-swarm.git"
  ]
}
```

启动 OpenCode。首次加载时插件会自动完成：
1. 拷贝提示词文件到 `~/.config/opencode/prompts/`
2. 拷贝技能到 `~/.config/opencode/skills/`
3. 生成默认模型配置 `~/.config/opencode/task-orchestration.json`

`task-build` 自动成为默认 agent。

### 验证安装

启动 OpenCode 后，输入以下命令确认 9 个 agent 在线：

```
@task-build 列出你可调度的所有子代理
```
## 提示词与升级

所有 agent 的提示词以 `.md` 文件存放在 `~/.config/opencode/prompts/`：

```
~/.config/opencode/prompts/
├── _global.md          ← 全局规则
├── task-build.md       ← 主代理提示词
├── code-fix.md
├── code-full.md
├── planner.md
├── reviewer.md
├── librarian.md
├── browser-agent.md
├── bug-diagnoser.md
└── ui-designer.md
```

**直接编辑这些文件即可自定义任何 agent 的行为**，无需修改源码。

升级时运行 `npx github:laobiao651/opencode-agent-swarm`，已修改的提示词不会被覆盖，但会生成 `.md.default` 文件供你对比最新版本。

## 内置命令

在 OpenCode 中直接使用：

| 命令 | 说明 |
|---|---|
| `/setup-swarm` | 一键安装/更新提示词、技能和配置文件到本地 |
| `/swarm-update` | 清除插件缓存并升级到最新版本 |

当新版本发布时，OpenCode 启动会自动提示更新。

## 模型配置（可选，不配置则用默认模型）

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
