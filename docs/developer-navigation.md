# Developer Navigation

## 1. 先看哪里
- 当前连续迭代记录：`docs/current-progress.md`
- 项目总览与启动：`README.md`
- 测试矩阵与回归说明：`TEST_DOCUMENTATION.md`

## 2. 目录速览
- 后端应用入口：`backend/src/main.ts`
- 后端模块汇总：`backend/src/app.module.ts`
- 用户资料/密码：`backend/src/users`
- 推荐系统：`backend/src/recommendations`
- 搜索与搜索历史：`backend/src/media/advanced-search.controller.ts`
- 下载任务：`backend/src/download-tasks`
- 前端页面：`frontend/src/views`
- 前端接口层：`frontend/src/api`
- 前端状态层：`frontend/src/stores`
- 前端高层回归：`frontend/test/views`

## 2.1 真实启动口径
- 后端默认端口：`http://localhost:3334`
- 前端默认端口：`http://localhost:5173`
- Swagger 默认入口：`http://localhost:3334/api`
- 如果 `3334` 被占用，后端会自动顺延到下一个可用端口；以 `backend/src/main.ts` 启动日志为准。

## 3. 现在最重要的前端页面
- 用户主链：
  - `frontend/src/views/HomeView.vue`
  - `frontend/src/views/MediaDetailView.vue`
  - `frontend/src/views/FavoritesView.vue`
  - `frontend/src/views/RecommendationsView.vue`
  - `frontend/src/views/SettingsView.vue`
- 认证与资料：
  - `frontend/src/views/LoginView.vue`
  - `frontend/src/views/RegisterView.vue`
  - `frontend/src/views/ProfileView.vue`
  - `frontend/src/views/SearchHistoryView.vue`
- 工具页：
  - `frontend/src/views/DownloadsView.vue`
  - `frontend/src/views/TorrentView.vue`
- 后台主链：
  - `frontend/src/views/AdminUsersView.vue`
  - `frontend/src/views/AdminMediaView.vue`
  - `frontend/src/views/AdminDownloadTasksView.vue`

## 4. 推荐回归命令
在仓库根目录执行：

```bash
npm run build --prefix frontend
npm run build --prefix backend
npm run test:journeys --prefix frontend
npm run test:journeys:admin --prefix frontend
npm run test:tools --prefix frontend
npm run test:regressions --prefix frontend
npx jest --runInBand --prefix backend
```

## 5. 当前高层测试护栏
- 用户内容主链：`frontend/test/views/UserJourney.spec.ts`
- 认证/资料主链：`frontend/test/views/AuthProfileJourney.spec.ts`
- 后台运营主链：`frontend/test/views/AdminJourney.spec.ts`
- 工具页：
  - `frontend/test/views/DownloadsView.spec.ts`
  - `frontend/test/views/TorrentView.spec.ts`

## 6. 当前真实接口习惯
- 用户与资料：`/users/*`，重点是 `/users/profile`、`/users/change-password`
- 推荐：`/recommendations/*`，重点是 `/recommendations/personalized-detailed`、`/recommendations/profile`
- 搜索与搜索历史：`/search/*`，重点是 `/search/suggestions`、`/search/history`
- 媒体与收藏：`/media/*`
- 下载任务：`/download-tasks/*`，重点是 `/download-tasks/user/me`、`/download-tasks/user/me/stats`
- 磁力资源：`/torrent/*`
- IPTV：`/iptv/*`
- 后台：`/admin/*`

## 7. 维护建议
- 优先在现有高层回归护栏内迭代，不要只改单点页面。
- 每做完一轮用户主链或后台主链改动，至少补一条对应 view spec。
- 继续清理旧页面时，优先处理高频入口和仍带旧编码痕迹的文件。
