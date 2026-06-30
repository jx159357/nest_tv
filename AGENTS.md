<!-- BEGIN SUPER DEV CODEX -->
# Super Dev for Codex CLI

Treat Codex App/Desktop selecting `super-dev` or `super-dev-seeai` from the `/` list, Codex CLI explicit `$super-dev` / `$super-dev-seeai`, and natural-language `super-dev:` / `super-dev：` / `super-dev-seeai:` / `super-dev-seeai：` messages as valid Super Dev entry points.

If the repository already contains active Super Dev workflow context, the first natural-language requirement in a new session must also continue Super Dev rather than normal chat.

## Direct Activation Rule
- Do not spend a turn saying you will read the skill first, explain the skill, or decide whether to enter the workflow.
- Treat the current trigger as already authorized to execute the full Super Dev pipeline.
- If a compatibility skill under `~/.codex/skills/` is loaded, treat it as the same Super Dev contract, not a fallback mode.

## Preferred official entry order
- Codex App/Desktop: prefer selecting `super-dev` from the `/` list. This is the enabled Skill entry, not a custom project slash command file.
- Codex CLI: prefer explicit `$super-dev`.
- Natural-language fallback for both surfaces: `super-dev: <需求描述>` or `super-dev：<需求描述>` through AGENTS.md.

## SEEAI Competition Mode
- If the user triggers `super-dev-seeai`, enter the SEEAI competition-fast contract instead of the standard long chain.
- SEEAI keeps research -> compact docs -> docs confirmation -> compact spec, then goes directly into a full-stack sprint and final polish.
- SEEAI still requires real files in `output/`, but the documents must stay compact and competition-oriented.

## Required execution
1. First reply: state that Super Dev pipeline mode is active and the current phase is `research`.
2. Read `knowledge/` and `output/knowledge-cache/*-knowledge-bundle.json` when available.
3. Use Codex native web/search/edit/terminal capabilities to perform similar-product research and write `output/*-research.md` into the repository workspace.
4. Draft `output/*-prd.md`, `output/*-architecture.md`, and `output/*-uiux.md` in the same Codex session and save them as actual project files.
5. Stop after the three core documents, summarize them, and wait for explicit confirmation.
6. Only after confirmation, create `.super-dev/changes/*/proposal.md` and `.super-dev/changes/*/tasks.md`, then continue with frontend-first implementation.

## Constraints
- Do not start coding directly after `/super-dev` skill entry, `$super-dev`, `super-dev:`, or `super-dev：`.
- Do not create Spec before document confirmation.
- If the user requests architecture changes, first update `output/*-architecture.md`, then realign Spec/tasks and implementation.
- If the user requests quality or security remediation, first fix the issues, rerun the quality gate, refresh any delivery evidence the reports ask for, and only then continue.
- 开始任何 UI 实现前，必须先锁定 `output/*-uiux.md` 中冻结的图标库、字体系统、design token system、组件生态和页面骨架。
- Before any UI implementation, first lock the icon library, typography, design token system, component ecosystem, and page skeleton from `output/*-uiux.md`.
- Do not use emoji as functional icons or placeholders.
- For non-conversational AI products, avoid Claude / ChatGPT-style sidebar chat shells unless the UI plan explicitly justifies them.
- Keep using the component ecosystem and design token direction defined in `output/*-uiux.md` rather than switching ad hoc.
- If a required artifact is only described in chat and not written into the repository, treat the step as incomplete.
- Codex remains the execution host; Super Dev is the local governance workflow.
- Use local `super-dev` CLI only for governance actions such as doctor, review, quality, release readiness, or update; do not outsource the main coding workflow to the CLI.

## Conversation Continuity Contract
- If `.super-dev/SESSION_BRIEF.md` exists, read it before responding and treat it as the active workflow state.
- If the workflow is waiting for docs confirmation, preview confirmation, UI revision, architecture revision, or quality revision, then user replies like `修改`, `补充`, `继续改`, `确认`, `通过`, `继续`, or detailed feedback remain inside the current Super Dev stage.
- After each requested revision inside a gate, stay in the same stage, update the required artifacts, summarize what changed, and wait again for explicit confirmation.
- Do not silently exit Super Dev mode because the user asked for several edits, follow-up questions, or extra constraints.
- Only leave the current Super Dev workflow if the user explicitly says to cancel the workflow, restart from scratch, or switch back to normal chat.

## Super Dev System Flow Contract
- SUPER_DEV_FLOW_CONTRACT_V1
- PHASE_CHAIN: research>docs>docs_confirm>spec>frontend>preview_confirm>backend>quality>delivery
- DOC_CONFIRM_GATE: required
- PREVIEW_CONFIRM_GATE: required
- HOST_PARITY: required
<!-- END SUPER DEV CODEX -->


<!-- BEGIN SUPER DEV OPENCODE -->
# Super Dev Integration for opencode

Super Dev 是“超级开发战队”，一个流水线式 AI Coding 辅助工具。
Super Dev does not provide model inference or coding APIs.
The host remains responsible for model execution, tools, and actual code generation.
Use the host model/runtime as-is; Super Dev only enforces the delivery protocol.
Use Super Dev generated artifacts as source of truth.

## Runtime Contract
- Treat Super Dev as a local Python CLI plus host-side rules/skills, not as a separate model provider.
- When the user triggers Super Dev, enter the protocol immediately instead of treating it as normal chat.
- When the user triggers `super-dev-seeai`, switch to the SEEAI competition-fast contract: research -> compact docs -> docs confirmation -> compact spec -> full-stack sprint -> polish/handoff.
- Use host-native web/search/browse for research and host-native editing/execution for implementation.
- Use local `super-dev` commands to generate/update documents, spec artifacts, quality reports, and delivery outputs.

## First-Response Contract
- On the first reply after a host-supported Super Dev entry (for example `/super-dev ...`, `$super-dev`, `super-dev: ...`, `super-dev：...`, `/super-dev-seeai ...`, `$super-dev-seeai`, `super-dev-seeai: ...`, or `super-dev-seeai：...`), explicitly state that the matching Super Dev mode is now active rather than normal chat mode.
- If the repository already contains `super-dev.yaml`, `.super-dev/WORKFLOW.md`, `output/*`, `.super-dev/review-state/*`, or an unfinished run state, the first natural-language requirement in a new host session must also default to continuing Super Dev rather than plain chat.
- Before the first reply, read `.super-dev/WORKFLOW.md` and `output/*-bootstrap.md` when present, and treat them as the explicit bootstrap contract for this repository.
- The first reply must explicitly state that the current phase is `research`, and that you will read `knowledge/` plus `output/knowledge-cache/*-knowledge-bundle.json` first when available before similar-product research.
- In standard mode, the next sequence is research -> three core documents -> wait for user confirmation -> Spec / tasks -> frontend first with runtime verification -> backend / tests / delivery.
- In SEEAI mode, the next sequence is research -> compact competition docs -> wait for user confirmation -> compact Spec -> full-stack sprint -> polish / handoff.
- Both modes must explicitly promise that they will stop after the three core documents and wait for approval before creating Spec or writing code.

## Local Knowledge Contract
- Read relevant files under `knowledge/` before drafting documents.
- If `output/knowledge-cache/*-knowledge-bundle.json` exists, read its `local_knowledge`, `web_knowledge`, and `research_summary` first.
- Treat matched local knowledge, checklists, anti-patterns, and scenario packs as project constraints that must flow into docs, spec, and implementation.

## Conversation Continuity Contract
- If `.super-dev/SESSION_BRIEF.md` exists, read it before responding and treat it as the active workflow state.
- If the workflow is waiting for docs confirmation, preview confirmation, UI revision, architecture revision, or quality revision, then user replies like `修改`, `补充`, `继续改`, `确认`, `通过`, `继续`, or detailed feedback remain inside the current Super Dev stage.
- After each requested revision inside a gate, stay in the same stage, update the required artifacts, summarize what changed, and wait again for explicit confirmation.
- Do not silently exit Super Dev mode because the user asked for several edits, follow-up questions, or extra constraints.
- Only leave the current Super Dev workflow if the user explicitly says to cancel the workflow, restart from scratch, or switch back to normal chat.

## Trigger
- Preferred: `/super-dev <需求描述>`
- SEEAI competition mode: `/super-dev-seeai <需求描述>`
- Local terminal only handles install / update / uninstall; normal development should stay in the host session.

## Work Mode Contract
- Detect `new`, `evolve`, `variant`, `patch`, and `resume` before planning execution.
- `new` may go directly into research.
- `evolve`, `variant`, and `patch` must baseline the current repository before generating docs or Spec.
- `resume` is a normal default path after a closed window, reboot, or next-day continuation.

## Required Context
- output/*-prd.md
- output/*-architecture.md
- output/*-uiux.md
- output/*-execution-plan.md
- .super-dev/changes/*/tasks.md

## Execution Order
1. Detect the work mode and, for existing-project work, baseline the current repository first into `output/*-baseline-audit.md` / `.json`
2. Use the host's native browse/search/web capability to research similar products first and produce output/*-research.md as a real repository file
3. Freeze PRD, architecture and UIUX documents and write them into output/* files in the repository workspace rather than only describing them in chat
4. Stop after the three core documents, summarize them to the user, and wait for explicit confirmation before creating Spec or coding
5. Create Spec proposal/tasks only after the user confirms the documents
6. Implement and run the frontend first so it becomes demonstrable before backend-heavy work
7. Implement backend APIs and data layer, then run tests, quality gate, and release preparation
8. If the user says the UI is unsatisfactory, asks for a redesign, or says the page looks AI-generated, first update `output/*-uiux.md`, then redo frontend implementation, rerun frontend runtime and UI review, and only then continue.
9. If the user says the architecture is wrong or the technical plan must change, first update `output/*-architecture.md`, then realign tasks and implementation before continuing.
10. If the user says quality or security is not acceptable, first fix the issues, rerun the quality gate, refresh any delivery evidence the reports ask for, and only then continue.
11. Before any UI implementation, first lock the icon library, typography, token system, component ecosystem, and page skeleton according to `output/*-uiux.md`.
12. Do not use emoji as functional icons or placeholders, and do not leave icon decisions for later.
13. For non-conversational AI products, default to avoiding Claude / ChatGPT-style sidebar chat shells, narrow-center conversation layouts, and the same neutral chat color shell unless the UI plan explicitly justifies it.
14. UI implementation must use the recommended component ecosystem/design token direction from `output/*-uiux.md`, not switch ad hoc.


## Coding Constraints (active during ALL coding phases)

These rules apply every time you write or edit a file:

### Tech Stack Pre-Research
- Before writing ANY code, run `cat package.json` (or equivalent) to check framework versions.
- If unsure about an API, use WebFetch to read official docs first. Never guess.

### Icon & Visual Rules
- Icons MUST come from a declared icon library (Lucide/Heroicons/Tabler). No emoji as icons.
- No purple/pink gradient themes. No default system font only.

### Frontend/Backend Alignment
- Frontend fetch URLs must exactly match backend route definitions.
- Define API paths as shared constants when possible.

### Per-File Self-Check
- Before writing each file: correct imports, no emoji, colors from tokens only.
- After completing a feature, run build + lint. Fix errors before moving on.

## Super Dev System Flow Contract
- SUPER_DEV_FLOW_CONTRACT_V1
- PHASE_CHAIN: research>docs>docs_confirm>spec>frontend>preview_confirm>backend>quality>delivery
- DOC_CONFIRM_GATE: required
- PREVIEW_CONFIRM_GATE: required
- HOST_PARITY: required
<!-- END SUPER DEV OPENCODE -->

<!-- BEGIN SUPER DEV CURSOR -->
---
description: "Super Dev pipeline governance - research-first commercial-grade delivery. Activates when user says /super-dev or super-dev:"
alwaysApply: true
---

# Super Dev Pipeline Rules
- When the user triggers `/super-dev ...`, enter Super Dev pipeline mode immediately.
- Start with research and write output/*-research.md as a real file in the repository.
- Always read and maintain output/*-prd.md, output/*-architecture.md, and output/*-uiux.md as source-of-truth project files.
- Summarize the three core documents to the user and wait for user confirmation before creating Spec/tasks or writing code.
- Create Spec/tasks only after confirmation.
- Execute frontend-first delivery before backend/database tasks, then run quality gate before release.
- Before any UI implementation, first lock the icon library, typography, design token system, component ecosystem, and page skeleton from output/*-uiux.md.
- Do not use emoji as functional icons or placeholders.
- For non-conversational AI products, avoid Claude / ChatGPT-style sidebar chat shells unless the UI plan explicitly justifies them.
- Keep using the component ecosystem and design token direction defined in output/*-uiux.md rather than switching ad hoc.
- If `.super-dev/SESSION_BRIEF.md` exists, read it before responding and keep the current Super Dev gate active across follow-up edits.

## Coding Constraints (active during ALL coding phases)
- Before writing ANY code, run `cat package.json` to check framework versions. If unsure, read official docs first.
- Icons MUST come from Lucide/Heroicons/Tabler. No emoji as icons. No purple/pink gradient themes.
- Frontend fetch URLs must exactly match backend route definitions.
- Before writing each file: correct imports, no emoji, colors from tokens only.
- After completing a feature, run build + lint. Fix errors before moving on.

## Super Dev System Flow Contract
- SUPER_DEV_FLOW_CONTRACT_V1
- PHASE_CHAIN: research>docs>docs_confirm>spec>frontend>preview_confirm>backend>quality>delivery
- DOC_CONFIRM_GATE: required
- PREVIEW_CONFIRM_GATE: required
- HOST_PARITY: required
<!-- END SUPER DEV CURSOR -->

