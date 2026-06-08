# opencode-agent-swarm

OpenCode 多智能体编排插件 —— Task Build 主代理调度 9 个子代理协作完成复杂开发任务。

## 智能体

### 主代理

**task-build** — 任务调度中枢。负责架构侦察、方案制定、子代理派发和结果验收。不直接写代码，只做决策和调度。

> 默认模型: `opencode-go/deepseek-v4-pro`

### 子代理

| Agent | 角色 | 默认模型 |
|---|---|---|
| **code-fix** | 轻量实施代理。处理 bug 修复、typo、文案、import 调整、配置微调、小范围重构（≤2 文件 ≤30 行） | `google-agy/gemini-3.5-flash` |
| **code-full** | 复杂实施代理。跨模块改动、新功能开发、重构、DB schema、API 设计 | `google/gemini-3-flash-preview` |
| **planner** | 计划编写代理。多步骤任务拆解、标注依赖、识别风险 | `google-agy/gemini-3.1-pro-low` |
| **reviewer** | 独立代码审查代理。检查正确性、安全、范围越界，只读 diff 挑刺 | `google/gemini-3.1-pro-preview` |
| **librarian** | 知识查询代理。外部文档、API 用法、技术资料检索与交叉验证 | `opencode/deepseek-v4-flash-free` |
| **browser-agent** | 浏览器取证代理。CDP 调试、E2E 测试、性能诊断、页面验证 | `google/gemini-3-flash-preview` |
| **bug-diagnoser** | Bug 诊断代理。系统性排查、复现、二分定位、输出诊断报告（不修代码） | `google/gemini-3.1-pro-preview` |
| **ui-designer** | UI/UX 代理。布局、CSS、响应式、动效、无障碍优化 | `google-agy/gemini-3.5-flash` |

## 安装

在 `~/.config/opencode/opencode.json` 的 `plugin` 数组中添加：

```jsonc
{
  "plugin": [
    "opencode-agent-swarm@git+https://github.com/laobiao651/opencode-agent-swarm.git"
  ]
}
```

启动 OpenCode，插件首次加载时自动完成：

- 安装 9 个 agent 定义到 `~/.config/opencode/agents/`
- 安装 `modular-reuse-design` 技能到 `~/.config/opencode/skills/`
- 生成默认模型配置 `~/.config/opencode/task-orchestration.json`
- 设置 `task-build` 为默认 agent

## 使用

在 OpenCode 中输入 `@task-build` 使用主调度代理，或直接 `Tab` 切换到 task-build。

任务派发流程：

```
用户请求 → task-build（摸底 + 方案）
              ├── 轻 → 派 code-fix
              ├── 重 → 派 planner 出 plan → 派 code-full → 派 reviewer
              ├── 查 → 派 explore / librarian / browser-agent
              └── UI → 派 ui-designer
```

也可以手动 `@` 调用任意子代理：

```
@code-fix 修复 src/utils.ts 的 typo
@reviewer 审查最近的改动
@librarian 查询 React 19 的 useActionState 用法
```

## 模型配置

编辑 `~/.config/opencode/task-orchestration.json`（首次安装自动生成）：

```jsonc
{
  "agents": {
    "task-build":    { "model": "google/gemini-3-pro-preview" },
    "code-fix":      { "model": "anthropic/claude-sonnet-4" },
    "code-full":     { "model": "google/gemini-3-flash-preview", "temperature": 0.3 },
    "reviewer":      { "model": "google/gemini-3.1-pro-preview", "variant": "high" }
    // 未列出的 agent 使用默认模型
  }
}
```

每个 agent 可选字段：

| 字段 | 说明 |
|---|---|
| `model` | 模型 ID（如 `google/gemini-3-pro-preview`） |
| `variant` | 模型变体（`high` / `medium` / `low`） |
| `temperature` | 温度参数（0.0 ~ 1.0） |

## 更新

插件每次启动时后台检查 GitHub Releases（结果缓存 24 小时）。有新版本时控制台显示提示：

```
[agent-swarm] 🔔 新版本 v2.1.0 可用（当前 v2.0.1）
  升级方法：删除 ~/.cache/opencode/packages/opencode-agent-swarm@git+https: 后重启 OpenCode
```

## 技能

| 技能 | 说明 |
|---|---|
| `modular-reuse-design` | 模块化复用设计决策（三层扫描 + 五级决策框架） |

## License

MIT
