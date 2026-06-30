# Host Onboard Smoke Guide

- Generated At: 2026-06-30T02:38:53.282094+00:00
- Project: D:\demo_jx\cursor_pro\nest_tv
- Install Scope: project surfaces only
- Status: ok

## Claude Code

- Status: ready
- Standard Flow First Prompt: `/super-dev 你的需求`
- Competition Flow First Prompt: `/super-dev-seeai 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 优先在当前 Claude Code 会话里直接用 /super-dev，不要先退回普通聊天交代背景。
- 避免动作: 不要先手写一串 spec / quality / release 命令来替代宿主入口。

### Post-Onboard Self-Check
- Claude Code 接入后先确认入口可用: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- Claude Code 接入后再确认 SEEAI 项目补充面已写入: .claude/commands/super-dev-seeai.md / .claude/skills/super-dev-seeai/SKILL.md
- Claude Code 接入后再确认 SEEAI 用户级补充面已写入: ~/.claude/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 Claude Code 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 CLAUDE.md / .claude/CLAUDE.md / .claude/skills/super-dev/SKILL.md；用户侧 ~/.claude/skills/super-dev/SKILL.md / ~/.claude/agents/super-dev.md
- 如启用当前增强接入面，再确认: 项目侧 .claude/settings.json / .claude/settings.local.json；用户侧 ~/.claude/CLAUDE.md / ~/.claude/settings.json
- 确认 SEEAI 项目补充面真实生效: .claude/commands/super-dev-seeai.md / .claude/skills/super-dev-seeai/SKILL.md
- 确认 SEEAI 用户级补充面真实生效: ~/.claude/skills/super-dev-seeai/SKILL.md
- 确认当前 Claude Code 会话真实读取 CLAUDE.md、.claude/CLAUDE.md、可选 .claude/settings*.json、.claude/skills 与 .claude/agents，而不是只把文件写进仓库。

### Official Pass Criteria
- Claude Code 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Claude Code 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 CLAUDE.md / .claude/CLAUDE.md / .claude/skills/super-dev/SKILL.md；用户侧 ~/.claude/skills/super-dev/SKILL.md / ~/.claude/agents/super-dev.md
- 如启用当前增强接入面，再确认: 项目侧 .claude/settings.json / .claude/settings.local.json；用户侧 ~/.claude/CLAUDE.md / ~/.claude/settings.json

### Resume Guidance
- 优先入口: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- 原生恢复: /super-dev 继续当前流程 / 回当前 Claude Code 会话继续
- 优先沿用当前宿主会话恢复，不要先走新的普通聊天入口。

### Repair Playbook
-

### SEEAI Project Supplements
- `.claude/commands/super-dev-seeai.md`
- `.claude/skills/super-dev-seeai/SKILL.md`
- `plugins/super-dev-claude/skills/super-dev-seeai/SKILL.md`

### SEEAI User Supplements
- `~/.claude/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `C:\Users\Administrator\.claude\skills\super-dev`
- `D:\demo_jx\cursor_pro\nest_tv\.claude-plugin\marketplace.json`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\CLAUDE.md`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\agents\super-dev.md`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\commands\super-dev-seeai.md`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\commands\super-dev.md`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\settings.local.json`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\skills\super-dev-seeai\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\.claude\skills\super-dev\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\CLAUDE.md`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-claude\.claude-plugin\plugin.json`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-claude\README.md`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-claude\skills\super-dev-seeai\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-claude\skills\super-dev\SKILL.md`

## Codex CLI

- Status: ready
- Standard Flow First Prompt: `$super-dev`
- Competition Flow First Prompt: `$super-dev-seeai`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 在 Codex CLI 里优先显式输入 $super-dev，不要先把 App/Desktop 的 / 列表入口和 CLI 混成一个宿主。
- 避免动作: 不要一上来先跑一串 release / proof-pack / quality 命令。

### Post-Onboard Self-Check
- Codex CLI 接入后先确认入口可用: $super-dev / super-dev: 你的需求
- Codex CLI 接入后再确认 SEEAI 项目补充面已写入: .agents/skills/super-dev-seeai/SKILL.md / plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md
- Codex CLI 接入后再确认 SEEAI 用户级补充面已写入: ~/.agents/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 Codex CLI 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .agents/skills/super-dev/SKILL.md；用户侧 ~/.agents/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .agents/plugins/marketplace.json / plugins/super-dev-codex/.codex-plugin/plugin.json；用户侧 ~/.codex/AGENTS.md
- 确认 SEEAI 项目补充面真实生效: .agents/skills/super-dev-seeai/SKILL.md / plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md
- 确认 SEEAI 用户级补充面真实生效: ~/.agents/skills/super-dev-seeai/SKILL.md
- 确认当前 Codex CLI 会话里的 $super-dev 真实可用，并已读取仓库 AGENTS 与 Skills。

### Official Pass Criteria
- Codex CLI 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Codex CLI 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .agents/skills/super-dev/SKILL.md；用户侧 ~/.agents/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .agents/plugins/marketplace.json / plugins/super-dev-codex/.codex-plugin/plugin.json；用户侧 ~/.codex/AGENTS.md

### Resume Guidance
- 优先入口: $super-dev / super-dev: 你的需求
- 原生恢复: $super-dev / super-dev: 继续当前流程
- 优先沿用当前 Skill / session 入口，不要先退回普通聊天。

### Repair Playbook
-

### SEEAI Project Supplements
- `.agents/skills/super-dev-seeai/SKILL.md`
- `plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md`

### SEEAI User Supplements
- `~/.agents/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `C:\Users\Administrator\.agents\skills\super-dev`
- `D:\demo_jx\cursor_pro\nest_tv\.agents\plugins\marketplace.json`
- `D:\demo_jx\cursor_pro\nest_tv\.agents\skills\super-dev-seeai\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\.agents\skills\super-dev\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\AGENTS.md`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-codex\.codex-plugin\plugin.json`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-codex\README.md`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-codex\skills\super-dev-seeai\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\plugins\super-dev-codex\skills\super-dev\SKILL.md`

## OpenCode

- Status: ready
- Standard Flow First Prompt: `/super-dev 你的需求`
- Competition Flow First Prompt: `/super-dev-seeai 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 优先在当前 OpenCode 会话里直接用 /super-dev，并让 AGENTS、commands、skills 先接住流程；`.opencode/agents/` 作为增强层再核对。
- 避免动作: 不要新开普通聊天会话再重讲同一项目。

### Post-Onboard Self-Check
- OpenCode 接入后先确认入口可用: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- OpenCode 接入后再确认 SEEAI 项目补充面已写入: .opencode/commands/super-dev-seeai.md / .opencode/skills/super-dev-seeai/SKILL.md
- OpenCode 接入后再确认 SEEAI 用户级补充面已写入: ~/.config/opencode/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 OpenCode 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .opencode/commands/super-dev.md / .opencode/skills/super-dev/SKILL.md；用户侧 ~/.config/opencode/AGENTS.md / ~/.config/opencode/commands/super-dev.md / ~/.config/opencode/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .opencode/agents/super-dev.md；用户侧 ~/.config/opencode/agents/super-dev.md
- 确认 SEEAI 项目补充面真实生效: .opencode/commands/super-dev-seeai.md / .opencode/skills/super-dev-seeai/SKILL.md
- 确认 SEEAI 用户级补充面真实生效: ~/.config/opencode/skills/super-dev-seeai/SKILL.md
- 确认当前 OpenCode 会话真实加载 AGENTS.md、.opencode/commands、.opencode/skills，并能直接走 /super-dev；`.opencode/agents/` 只按增强层核对。

### Official Pass Criteria
- OpenCode 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 OpenCode 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .opencode/commands/super-dev.md / .opencode/skills/super-dev/SKILL.md；用户侧 ~/.config/opencode/AGENTS.md / ~/.config/opencode/commands/super-dev.md / ~/.config/opencode/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .opencode/agents/super-dev.md；用户侧 ~/.config/opencode/agents/super-dev.md

### Resume Guidance
- 优先入口: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- 原生恢复: /super-dev 继续当前流程 / 回当前 OpenCode 会话继续
- 优先沿用当前宿主会话恢复，不要先走新的普通聊天入口。

### Repair Playbook
-

### SEEAI Project Supplements
- `.opencode/commands/super-dev-seeai.md`
- `.opencode/skills/super-dev-seeai/SKILL.md`

### SEEAI User Supplements
- `~/.config/opencode/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `C:\Users\Administrator\.config\opencode\skills\super-dev`
- `D:\demo_jx\cursor_pro\nest_tv\.opencode\agents\super-dev.md`
- `D:\demo_jx\cursor_pro\nest_tv\.opencode\commands\super-dev-seeai.md`
- `D:\demo_jx\cursor_pro\nest_tv\.opencode\commands\super-dev.md`
- `D:\demo_jx\cursor_pro\nest_tv\.opencode\skills\super-dev-seeai\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\.opencode\skills\super-dev\SKILL.md`
- `D:\demo_jx\cursor_pro\nest_tv\AGENTS.md`

## Cursor CLI

- Status: ready
- Standard Flow First Prompt: `super-dev: 你的需求`
- Competition Flow First Prompt: `super-dev-seeai: 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 优先在当前 Cursor CLI 项目会话里直接用 super-dev:。
- 避免动作: 不要先跳去普通聊天或手工堆一串治理命令。

### Post-Onboard Self-Check
- Cursor CLI 接入后先确认入口可用: super-dev: 你的需求 / super-dev-seeai: 比赛需求
- Cursor CLI 接入后再确认 SEEAI 用户级补充面已写入: ~/.cursor/skills/super-dev-seeai/SKILL.md
- 确认 Cursor CLI 按 official-context 官方协议面真实加载 Super Dev，而不是只检测到文件存在。

### Official Workflow Checks
- 确认 Cursor CLI 按 official-context 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .cursor/rules/super-dev.mdc
- 如启用当前增强接入面，再确认: 项目侧 CLAUDE.md
- 确认 SEEAI 用户级补充面真实生效: ~/.cursor/skills/super-dev-seeai/SKILL.md
- 确认当前 Cursor CLI 会话真实读取 AGENTS.md 与 .cursor/rules，并能按 super-dev: 延续流程；根 CLAUDE.md 只作为兼容说明。

### Official Pass Criteria
- Cursor CLI 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Cursor CLI 按 official-context 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .cursor/rules/super-dev.mdc
- 如启用当前增强接入面，再确认: 项目侧 CLAUDE.md

### Resume Guidance
- 优先入口: super-dev: 你的需求 / super-dev-seeai: 比赛需求
- 原生恢复: super-dev: 继续当前流程 / 回当前 Cursor CLI 会话继续
- 优先沿用当前宿主会话恢复，不要先走新的普通聊天入口。

### Repair Playbook
-

### SEEAI User Supplements
- `~/.cursor/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `D:\demo_jx\cursor_pro\nest_tv\.cursor\rules\super-dev.mdc`
- `D:\demo_jx\cursor_pro\nest_tv\AGENTS.md`

## Cursor

- Status: ready
- Standard Flow First Prompt: `/super-dev 你的需求`
- Competition Flow First Prompt: `/super-dev-seeai 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 优先在当前 Cursor Agent Chat 里直接用 /super-dev，保持当前项目上下文。
- 避免动作: 不要先新开一个普通聊天窗口再重述需求。

### Post-Onboard Self-Check
- Cursor 接入后先确认入口可用: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- Cursor 接入后再确认 SEEAI 项目补充面已写入: .cursor/commands/super-dev-seeai.md
- Cursor 接入后再确认 SEEAI 用户级补充面已写入: ~/.cursor/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 Cursor 按 official-context 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .cursor/rules/super-dev.mdc
- 如启用当前增强接入面，再确认: 项目侧 CLAUDE.md / .cursor/commands/super-dev.md；用户侧 ~/.cursor/commands/super-dev.md
- 确认 SEEAI 项目补充面真实生效: .cursor/commands/super-dev-seeai.md
- 确认 SEEAI 用户级补充面真实生效: ~/.cursor/skills/super-dev-seeai/SKILL.md
- 确认当前 Cursor Agent Chat 真实加载 AGENTS.md 与 .cursor/rules；若使用 `.cursor/commands`，把它视为 beta 增强面而不是唯一官方合同。

### Official Pass Criteria
- Cursor 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Cursor 按 official-context 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .cursor/rules/super-dev.mdc
- 如启用当前增强接入面，再确认: 项目侧 CLAUDE.md / .cursor/commands/super-dev.md；用户侧 ~/.cursor/commands/super-dev.md

### Resume Guidance
- 优先入口: /super-dev 你的需求 / /super-dev-seeai 比赛需求
- 原生恢复: /super-dev 继续当前流程 / 回当前 Cursor Agent Chat 会话继续
- 优先沿用当前 Agent Chat 连续性，不要切到新的聊天线程。

### Repair Playbook
-

### SEEAI Project Supplements
- `.cursor/commands/super-dev-seeai.md`

### SEEAI User Supplements
- `~/.cursor/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `D:\demo_jx\cursor_pro\nest_tv\.cursor\commands\super-dev-seeai.md`
- `D:\demo_jx\cursor_pro\nest_tv\.cursor\commands\super-dev.md`
- `D:\demo_jx\cursor_pro\nest_tv\AGENTS.md`

## Claude

- Status: ready
- Standard Flow First Prompt: `super-dev: 你的需求`
- Competition Flow First Prompt: `super-dev-seeai: 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: 先在当前 Claude Project 里挂好 instructions / knowledge，再直接用 super-dev:。
- 避免动作: 不要把 Claude Desktop 当成有稳定仓库级 dotfile 注入的 CLI 宿主。

### Post-Onboard Self-Check
- Claude 接入后先确认入口可用: super-dev: 你的需求 / super-dev-seeai: 比赛需求
- 确认 Claude 按 official-projects 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- Claude 接入后再确认恢复链可用: 回当前 Claude Project 会话继续 / super-dev: 继续当前流程

### Official Workflow Checks
- 确认 Claude 按 official-projects 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认当前 Claude Project 真实挂上 Project Instructions、Project Knowledge 与需要的 extensions / MCP。

### Official Pass Criteria
- Claude 官方工作流面、入口链和恢复链均已真人验收通过。
- 确认 Claude 按 official-projects 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认当前 Claude Project 真实挂上 Project Instructions、Project Knowledge 与需要的 extensions / MCP。

### Resume Guidance
- 优先入口: super-dev: 你的需求 / super-dev-seeai: 比赛需求
- 原生恢复: 回当前 Claude Project 会话继续 / super-dev: 继续当前流程
- 优先沿用当前任务线程，不要重新开一个新的任务流。

### Repair Playbook
-

## Codex

- Status: ready
- Standard Flow First Prompt: `/super-dev 你的需求`
- Competition Flow First Prompt: `/super-dev-seeai 比赛需求`
- Install Scope: project surfaces only

### Start Playbook
- 起手建议: App/Desktop 优先从 / 列表里的 super-dev 进入，不要先退回普通聊天。
- 避免动作: 不要把桌面端入口和 CLI 的 $super-dev 混成同一个宿主。

### Post-Onboard Self-Check
- Codex 接入后先确认入口可用: /super-dev 你的需求 / super-dev: 你的需求
- Codex 接入后再确认 SEEAI 项目补充面已写入: .agents/skills/super-dev-seeai/SKILL.md / plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md
- Codex 接入后再确认 SEEAI 用户级补充面已写入: ~/.agents/skills/super-dev-seeai/SKILL.md

### Official Workflow Checks
- 确认 Codex 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .agents/skills/super-dev/SKILL.md；用户侧 ~/.agents/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .agents/plugins/marketplace.json / plugins/super-dev-codex/.codex-plugin/plugin.json；用户侧 ~/.codex/AGENTS.md
- 确认 SEEAI 项目补充面真实生效: .agents/skills/super-dev-seeai/SKILL.md / plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md
- 确认 SEEAI 用户级补充面真实生效: ~/.agents/skills/super-dev-seeai/SKILL.md
- 确认 Codex App/Desktop 的 / 列表 super-dev 真实可用，并已读取仓库 AGENTS 与 Skills。

### Official Pass Criteria
- Codex 官方工作流面、入口链、恢复链与 SEEAI 补充面均已真人验收通过。
- 确认 Codex 按 official-skill 官方协议面真实加载 Super Dev，而不是只检测到文件存在。
- 确认官方接入面真实生效: 项目侧 AGENTS.md / .agents/skills/super-dev/SKILL.md；用户侧 ~/.agents/skills/super-dev/SKILL.md
- 如启用当前增强接入面，再确认: 项目侧 .agents/plugins/marketplace.json / plugins/super-dev-codex/.codex-plugin/plugin.json；用户侧 ~/.codex/AGENTS.md

### Resume Guidance
- 优先入口: /super-dev 你的需求 / super-dev: 你的需求
- 原生恢复: /super-dev 继续当前流程 / 回当前 Codex 会话继续
- 优先沿用当前 Skill / session 入口，不要先退回普通聊天。

### Repair Playbook
-

### SEEAI Project Supplements
- `.agents/skills/super-dev-seeai/SKILL.md`
- `plugins/super-dev-codex/skills/super-dev-seeai/SKILL.md`

### SEEAI User Supplements
- `~/.agents/skills/super-dev-seeai/SKILL.md`

### Written Surfaces
- `D:\demo_jx\cursor_pro\nest_tv\AGENTS.md`
