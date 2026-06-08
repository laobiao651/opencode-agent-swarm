# opencode-agent-swarm

OpenCode 多智能体编排插件 —— Task Build 主代理调度 9 智能体协作体系。

## 安装

在 `~/.config/opencode/opencode.json` 的 `plugin` 数组中添加：

```jsonc
{
  "plugin": [
    "opencode-agent-swarm@git+https://github.com/laobiao651/opencode-agent-swarm.git"
  ]
}
```

启动 OpenCode。插件首次加载时自动完成全部安装。

## 命令

`@task-build` 开始使用调度代理。

## 模型配置

编辑 `~/.config/opencode/task-orchestration.json`。

## License

MIT
