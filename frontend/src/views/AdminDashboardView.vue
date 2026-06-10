<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="dashboard__header">
      <h1 class="dashboard__title">仪表盘</h1>
      <p class="dashboard__subtitle">系统概览和关键数据统计</p>
    </div>

    <!-- 统计卡片 -->
    <div class="dashboard__stats-grid">
      <div v-for="card in statCards" :key="card.label" class="dashboard__stat-card">
        <div class="dashboard__stat-inner">
          <div class="dashboard__stat-icon" :class="card.iconBg">
            {{ card.icon }}
          </div>
          <div>
            <div class="dashboard__stat-label">{{ card.label }}</div>
            <div class="dashboard__stat-value">{{ card.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="collectionLoading && !collectionStatistics" class="dashboard__loading-card">
      <div class="dashboard__loading-inner">
        <div class="dashboard__spinner"></div>
        <p class="dashboard__loading-text">正在加载稳定源采集监控...</p>
      </div>
    </div>

    <div v-else-if="collectionStatistics" class="dashboard__monitor">
      <div class="dashboard__monitor-header">
        <div class="dashboard__monitor-header-content">
          <div class="dashboard__monitor-info">
            <span class="dashboard__monitor-badge"> 稳定源采集监控 </span>
            <h2 class="dashboard__monitor-title">
              每日自动采集的可用稳定播放源，现在也能在后台首页直接看到
            </h2>
            <p class="dashboard__monitor-desc">
              这里汇总真实来源、已入库媒体、播放源活跃度、平均质量分，以及最近一次入库和校验时间，方便持续盯住影视聚合平台的稳定供给。
            </p>
            <p v-if="collectionError" class="dashboard__monitor-error">
              {{ collectionError }}
            </p>
          </div>

          <div class="dashboard__monitor-stats">
            <div class="dashboard__monitor-stat">
              <div class="dashboard__monitor-stat-label">启用来源</div>
              <div class="dashboard__monitor-stat-value">
                {{ collectionStatistics.enabledSources }}
              </div>
              <div class="dashboard__monitor-stat-desc">
                日采集 {{ collectionStatistics.dailyEnabledSources }} · 高质量
                {{ collectionStatistics.stableSources }}
              </div>
            </div>

            <div class="dashboard__monitor-stat">
              <div class="dashboard__monitor-stat-label">媒体入库</div>
              <div class="dashboard__monitor-stat-value">
                {{ collectionStatistics.totalMedia }}
              </div>
              <div class="dashboard__monitor-stat-desc">
                活跃媒体 {{ collectionStatistics.activeMedia }}
              </div>
            </div>

            <div class="dashboard__monitor-stat">
              <div class="dashboard__monitor-stat-label">播放源池</div>
              <div class="dashboard__monitor-stat-value">
                {{ collectionStatistics.totalPlaySources }}
              </div>
              <div class="dashboard__monitor-stat-desc">
                活跃 {{ collectionStatistics.activePlaySources }} · 近24h
                {{ collectionStatistics.recentPlaySources24h }}
              </div>
            </div>

            <div class="dashboard__monitor-stat">
              <div class="dashboard__monitor-stat-label">综合质量</div>
              <div class="dashboard__monitor-stat-value">
                {{ collectionStatistics.averageQualityScore }}
              </div>
              <div class="dashboard__monitor-stat-desc">
                平均可用率 {{ collectionStatistics.averageActiveRate }}%
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard__monitor-body">
          <div class="dashboard__monitor-panel">
            <div class="dashboard__monitor-panel-header">
              <div>
                <h3 class="dashboard__monitor-panel-title">采集概览</h3>
                <p class="dashboard__monitor-panel-desc">
                  按真实采集来源、入库媒体、稳定播放源质量综合统计
                </p>
              </div>
              <router-link
                to="/admin/crawler"
                class="dashboard__link-btn dashboard__link-btn--primary"
              >
                前往爬虫管理
              </router-link>
            </div>

            <div class="dashboard__info-grid">
              <div class="dashboard__info-card">
                <div class="dashboard__info-label">来源覆盖</div>
                <div class="dashboard__info-value">
                  总来源 {{ collectionStatistics.totalSources }}，其中启用
                  {{ collectionStatistics.enabledSources }} 个，参与每日采集
                  {{ collectionStatistics.dailyEnabledSources }} 个。
                </div>
              </div>

              <div class="dashboard__info-card">
                <div class="dashboard__info-label">稳定性表现</div>
                <div class="dashboard__info-value">
                  当前高质量来源 {{ collectionStatistics.stableSources }} 个，平均质量分
                  {{ collectionStatistics.averageQualityScore }}，平均可用率
                  {{ collectionStatistics.averageActiveRate }}%。
                </div>
              </div>

              <div class="dashboard__info-card">
                <div class="dashboard__info-label">最近入库</div>
                <div class="dashboard__info-value">
                  {{ formatDateTime(collectionStatistics.latestCollectedAt) }}
                </div>
              </div>

              <div class="dashboard__info-card">
                <div class="dashboard__info-label">最近校验</div>
                <div class="dashboard__info-value">
                  {{ formatDateTime(collectionStatistics.latestValidatedAt) }}
                </div>
              </div>
            </div>

            <div class="dashboard__task-section">
              <div class="dashboard__task-header">
                <div>
                  <div class="dashboard__task-label">每日自动采集任务</div>
                  <div class="dashboard__task-status">
                    <span :class="['dashboard__badge', getDailyStatusClass(dailySummary?.status)]">
                      {{ getDailyStatusText(dailySummary?.status) }}
                    </span>
                    <span v-if="dailySummary" class="dashboard__task-meta">
                      {{ getTriggerText(dailySummary.trigger) }} ·
                      {{ formatDateTime(dailySummary.completedAt || dailySummary.startedAt) }}
                    </span>
                  </div>
                </div>
                <div v-if="dailySummary?.durationMs" class="dashboard__task-meta">
                  耗时 {{ formatDuration(dailySummary.durationMs) }}
                </div>
              </div>

              <div v-if="dailySummaryLoading && !dailySummary" class="dashboard__empty-state">
                正在加载任务状态...
              </div>

              <div v-else-if="dailySummary" class="dashboard__metrics-grid">
                <div class="dashboard__metric-card">
                  <div class="dashboard__metric-label">总尝试</div>
                  <div class="dashboard__metric-value">
                    {{ dailySummary.totalAttempted }}
                  </div>
                </div>
                <div class="dashboard__metric-card">
                  <div class="dashboard__metric-label">新建媒体 / 播放源</div>
                  <div class="dashboard__metric-value">
                    {{ dailySummary.totalCreatedMedia }} /
                    {{ dailySummary.totalCreatedPlaySources }}
                  </div>
                </div>
                <div class="dashboard__metric-card">
                  <div class="dashboard__metric-label">成功 / 失败</div>
                  <div class="dashboard__metric-value">
                    {{ dailySummary.totalSucceeded }} / {{ dailySummary.totalFailed }}
                  </div>
                </div>
                <div class="dashboard__metric-card">
                  <div class="dashboard__metric-label">校验通过</div>
                  <div class="dashboard__metric-value">
                    {{ dailySummary.validationSummary?.active || 0 }} /
                    {{ dailySummary.validationSummary?.checked || 0 }}
                  </div>
                </div>
              </div>

              <div v-else class="dashboard__empty-state">
                {{ dailySummaryError || '暂无每日自动采集执行记录。' }}
              </div>

              <p v-if="dailySummary?.message" class="dashboard__task-message">
                {{ dailySummary.message }}
              </p>
              <p v-if="dailySummaryError && dailySummary" class="dashboard__task-error">
                {{ dailySummaryError }}
              </p>

              <div class="dashboard__task-dashboard">
                <div class="dashboard__task-dashboard-header">
                  <div>
                    <div class="dashboard__task-label">任务结果看板</div>
                    <div class="dashboard__task-desc">
                      汇总最近几次每日采集执行结果，便于判断稳定性、失败趋势和异常来源。
                    </div>
                  </div>
                  <div class="dashboard__task-actions">
                    <button
                      class="dashboard__btn dashboard__btn--secondary"
                      :disabled="taskDashboardLoading || isTaskRunPending"
                      @click="loadTaskDashboard"
                    >
                      刷新看板
                    </button>
                    <button
                      class="dashboard__btn dashboard__btn--success"
                      :disabled="isTaskRunPending"
                      @click="triggerDailyCollectionRun"
                    >
                      {{ isTaskRunPending ? '任务执行中...' : '手动执行一次' }}
                    </button>
                  </div>
                </div>

                <div v-if="taskDashboardLoading && !taskDashboard" class="dashboard__empty-state">
                  正在加载任务结果看板...
                </div>

                <template v-else-if="taskDashboard">
                  <div class="dashboard__metrics-grid">
                    <div class="dashboard__metric-card">
                      <div class="dashboard__metric-label">近期待执行次数</div>
                      <div class="dashboard__metric-value">
                        {{ taskMetrics.totalRuns }}
                      </div>
                      <div class="dashboard__metric-desc">
                        定时 {{ taskMetrics.scheduledRuns }} · 手动 {{ taskMetrics.manualRuns }}
                      </div>
                    </div>
                    <div class="dashboard__metric-card">
                      <div class="dashboard__metric-label">成功率</div>
                      <div class="dashboard__metric-value">{{ taskMetrics.successRate }}%</div>
                      <div class="dashboard__metric-desc">
                        成功 {{ taskMetrics.successfulRuns }} · 异常 {{ taskMetrics.errorRuns }}
                      </div>
                    </div>
                    <div class="dashboard__metric-card">
                      <div class="dashboard__metric-label">平均耗时</div>
                      <div class="dashboard__metric-value">
                        {{ formatDuration(taskMetrics.averageDurationMs) }}
                      </div>
                      <div class="dashboard__metric-desc">
                        平均尝试 {{ taskMetrics.averageAttempted }} 条
                      </div>
                    </div>
                    <div class="dashboard__metric-card">
                      <div class="dashboard__metric-label">连续失败</div>
                      <div class="dashboard__metric-value">
                        {{ taskMetrics.failureStreak }}
                      </div>
                      <div class="dashboard__metric-desc">
                        最近成功 {{ formatDateTime(taskMetrics.lastSuccessAt) }}
                      </div>
                    </div>
                  </div>

                  <div class="dashboard__task-results-grid">
                    <div class="dashboard__task-results-panel">
                      <div class="dashboard__task-results-header">
                        <div>
                          <div class="dashboard__task-label">最近任务结果</div>
                          <div class="dashboard__task-desc">
                            保留最近 {{ recentTaskRuns.length }} 次执行快照
                          </div>
                        </div>
                      </div>

                      <div v-if="recentTaskRuns.length > 0" class="dashboard__task-runs-list">
                        <div
                          v-for="run in recentTaskRuns"
                          :key="run.id"
                          class="dashboard__task-run-card"
                        >
                          <div class="dashboard__task-run-header">
                            <div>
                              <div class="dashboard__task-run-status">
                                <span
                                  :class="['dashboard__badge', getDailyStatusClass(run.status)]"
                                >
                                  {{ getDailyStatusText(run.status) }}
                                </span>
                                <span class="dashboard__task-meta">
                                  {{ getTriggerText(run.trigger) }} ·
                                  {{ formatDateTime(run.completedAt || run.startedAt) }}
                                </span>
                              </div>
                              <div class="dashboard__task-run-message">
                                {{ run.message || '本次任务未返回额外说明。' }}
                              </div>
                            </div>
                            <div class="dashboard__task-meta">
                              {{ formatDuration(run.durationMs) }}
                            </div>
                          </div>
                          <div class="dashboard__task-run-stats">
                            <div>尝试 {{ run.totalAttempted }}</div>
                            <div>成功/失败 {{ run.totalSucceeded }} / {{ run.totalFailed }}</div>
                            <div>新建媒体 {{ run.totalCreatedMedia }}</div>
                            <div>新建播放源 {{ run.totalCreatedPlaySources }}</div>
                          </div>
                        </div>
                      </div>
                      <div v-else class="dashboard__empty-state">暂无任务历史记录。</div>
                    </div>

                    <div class="dashboard__task-results-panel">
                      <div class="dashboard__task-label">异常来源聚焦</div>
                      <div class="dashboard__task-desc">
                        汇总最近任务中反复失败或报错的来源，便于优先排查。
                      </div>

                      <div v-if="taskIssueSources.length > 0" class="dashboard__issue-sources-list">
                        <div
                          v-for="issue in taskIssueSources"
                          :key="issue.sourceName"
                          class="dashboard__issue-source-card"
                        >
                          <div class="dashboard__issue-source-header">
                            <div>
                              <div class="dashboard__issue-source-name">
                                {{ issue.sourceName }}
                              </div>
                              <div class="dashboard__issue-source-stats">
                                命中 {{ issue.affectedRuns }} 次 · 失败 {{ issue.totalFailed }} ·
                                报错 {{ issue.totalErrors }}
                              </div>
                            </div>
                            <span
                              :class="['dashboard__badge', getDailyStatusClass(issue.latestStatus)]"
                            >
                              {{ getDailyStatusText(issue.latestStatus) }}
                            </span>
                          </div>
                          <div class="dashboard__issue-source-time">
                            最近触发 {{ formatDateTime(issue.latestRunAt) }}
                          </div>
                          <div v-if="issue.latestError" class="dashboard__issue-source-error">
                            {{ issue.latestError }}
                          </div>
                        </div>
                      </div>
                      <div v-else class="dashboard__empty-state">最近任务暂无持续性异常来源。</div>
                    </div>
                  </div>
                </template>

                <div v-else class="dashboard__empty-state">
                  {{ taskDashboardError || '暂无任务看板数据。' }}
                </div>

                <p v-if="taskDashboardError && taskDashboard" class="dashboard__task-error">
                  {{ taskDashboardError }}
                </p>
              </div>
            </div>
          </div>

          <div class="dashboard__sidebar">
            <div class="dashboard__sources-panel">
              <div class="dashboard__sources-header">
                <div>
                  <h3 class="dashboard__sources-title">重点来源</h3>
                  <p class="dashboard__sources-desc">按质量分和可用率排序</p>
                </div>
                <span class="dashboard__sources-count">Top {{ topCollectionSources.length }}</span>
              </div>

              <div v-if="topCollectionSources.length > 0" class="dashboard__sources-list">
                <div
                  v-for="source in topCollectionSources"
                  :key="source.name"
                  class="dashboard__source-card"
                >
                  <div class="dashboard__source-header">
                    <div class="dashboard__source-info">
                      <div class="dashboard__source-name">{{ source.name }}</div>
                      <div class="dashboard__source-stats">
                        已入库 {{ source.totalCrawled }} · 活跃源 {{ source.activePlaySources }} /
                        {{ source.totalPlaySources }}
                      </div>
                    </div>
                    <span :class="['dashboard__badge', getQualityBadgeClass(source.qualityScore)]">
                      质量 {{ source.qualityScore }}
                    </span>
                  </div>

                  <div class="dashboard__source-meta">
                    <span>可用率 {{ source.activeRate }}%</span>
                    <span>提取 {{ source.extractionCoverage }}%</span>
                    <span>近 7 天新增 {{ source.recentMedia7d }}</span>
                    <span>代理 {{ source.proxyMode }}</span>
                    <span>最近入库 {{ formatDateTime(source.lastCrawled) }}</span>
                  </div>

                  <div class="dashboard__source-actions">
                    <div class="dashboard__source-hint">
                      可直接跳转到策略页或播放源页做进一步排障
                    </div>
                    <div class="dashboard__source-links">
                      <router-link
                        :to="buildCrawlerSourceLink(source.name, 'top')"
                        class="dashboard__link-btn dashboard__link-btn--primary"
                      >
                        查看来源
                      </router-link>
                      <router-link
                        :to="buildAdminPlaySourcesLink(source.name, 'top')"
                        class="dashboard__link-btn dashboard__link-btn--success"
                      >
                        排查播放源
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="dashboard__empty-state">
                暂无可展示的来源统计，等待采集任务产出真实数据。
              </div>
            </div>

            <div id="dashboard-alert-summary" class="dashboard__alerts-grid">
              <div class="dashboard__alert-card dashboard__alert-card--critical">
                <div class="dashboard__alert-label">立即止损</div>
                <div class="dashboard__alert-value">
                  {{ attentionSummary.criticalCount }}
                </div>
                <div class="dashboard__alert-desc">高风险来源</div>
                <div class="dashboard__alert-action-label">
                  {{ getAlertFilterRecommendedAction('critical').label }}
                </div>
                <div class="dashboard__alert-actions">
                  <router-link
                    :to="buildCrawlerAlertLink('critical')"
                    :class="getSummaryActionClass('critical', 'crawler', 'rose')"
                  >
                    {{ getSummaryActionLabel('critical', 'crawler', '来源视图') }}
                  </router-link>
                  <router-link
                    :to="buildAdminPlaySourcesAlertLink('critical')"
                    :class="getSummaryActionClass('critical', 'play-sources', 'rose')"
                  >
                    {{ getSummaryActionLabel('critical', 'play-sources', '播放源视图') }}
                  </router-link>
                </div>
              </div>
              <div class="dashboard__alert-card dashboard__alert-card--high">
                <div class="dashboard__alert-label">优先处理</div>
                <div class="dashboard__alert-value">
                  {{ attentionSummary.highCount }}
                </div>
                <div class="dashboard__alert-desc">中高风险来源</div>
                <div class="dashboard__alert-action-label">
                  {{ getAlertFilterRecommendedAction('high').label }}
                </div>
                <div class="dashboard__alert-actions">
                  <router-link
                    :to="buildCrawlerAlertLink('high')"
                    :class="getSummaryActionClass('high', 'crawler', 'amber')"
                  >
                    {{ getSummaryActionLabel('high', 'crawler', '来源视图') }}
                  </router-link>
                  <router-link
                    :to="buildAdminPlaySourcesAlertLink('high')"
                    :class="getSummaryActionClass('high', 'play-sources', 'amber')"
                  >
                    {{ getSummaryActionLabel('high', 'play-sources', '播放源视图') }}
                  </router-link>
                </div>
              </div>
              <div class="dashboard__alert-card dashboard__alert-card--stalled">
                <div class="dashboard__alert-label">入库停滞</div>
                <div class="dashboard__alert-value">
                  {{ attentionSummary.stalledIngestionCount }}
                </div>
                <div class="dashboard__alert-desc">超过 7 天无新入库</div>
                <div class="dashboard__alert-action-label">
                  {{ getAlertFilterRecommendedAction('stalled').label }}
                </div>
                <div class="dashboard__alert-actions">
                  <router-link
                    :to="buildCrawlerAlertLink('stalled')"
                    :class="getSummaryActionClass('stalled', 'crawler', 'sky')"
                  >
                    {{ getSummaryActionLabel('stalled', 'crawler', '来源视图') }}
                  </router-link>
                  <router-link
                    :to="buildAdminPlaySourcesAlertLink('stalled')"
                    :class="getSummaryActionClass('stalled', 'play-sources', 'sky')"
                  >
                    {{ getSummaryActionLabel('stalled', 'play-sources', '播放源视图') }}
                  </router-link>
                </div>
              </div>
              <div class="dashboard__alert-card dashboard__alert-card--inactive">
                <div class="dashboard__alert-label">无活跃源</div>
                <div class="dashboard__alert-value">
                  {{ attentionSummary.noActiveSourcesCount }}
                </div>
                <div class="dashboard__alert-desc">已失去可播能力</div>
                <div class="dashboard__alert-action-label">
                  {{ getAlertFilterRecommendedAction('inactive').label }}
                </div>
                <div class="dashboard__alert-actions">
                  <router-link
                    :to="buildCrawlerAlertLink('inactive')"
                    :class="getSummaryActionClass('inactive', 'crawler', 'fuchsia')"
                  >
                    {{ getSummaryActionLabel('inactive', 'crawler', '来源视图') }}
                  </router-link>
                  <router-link
                    :to="buildAdminPlaySourcesAlertLink('inactive')"
                    :class="getSummaryActionClass('inactive', 'play-sources', 'fuchsia')"
                  >
                    {{ getSummaryActionLabel('inactive', 'play-sources', '播放源视图') }}
                  </router-link>
                </div>
              </div>
            </div>

            <div class="dashboard__attention-panel">
              <div class="dashboard__attention-header">
                <div>
                  <h3 class="dashboard__attention-title">待关注来源</h3>
                  <p class="dashboard__attention-desc">筛出低质量、低可用率或缺少校验的来源</p>
                </div>
                <span class="dashboard__attention-count">{{ attentionSummary.total }} 项</span>
              </div>

              <div v-if="attentionCollectionSources.length > 0" class="dashboard__attention-list">
                <div
                  v-for="item in attentionCollectionSources"
                  :key="item.source.name"
                  class="dashboard__attention-card"
                >
                  <div class="dashboard__attention-card-header">
                    <div class="dashboard__attention-source-info">
                      <div class="dashboard__attention-source-name">
                        {{ item.source.name }}
                      </div>
                      <div class="dashboard__attention-source-stats">
                        质量 {{ item.source.qualityScore }} · 可用率 {{ item.source.activeRate }}% ·
                        提取 {{ item.source.extractionCoverage }}%
                      </div>
                    </div>
                    <span :class="['dashboard__badge', getAttentionBadgeClass(item.severity)]">
                      {{ getAttentionLabel(item.severity) }}
                    </span>
                  </div>

                  <div class="dashboard__attention-tags">
                    <span :class="['dashboard__score', getAttentionScoreClass(item.score)]">
                      风险分 {{ item.score }}
                    </span>
                    <span
                      v-for="highlight in item.highlights"
                      :key="highlight"
                      class="dashboard__highlight-tag"
                    >
                      {{ highlight }}
                    </span>
                  </div>

                  <div class="dashboard__attention-reasons">
                    <p v-for="reason in item.reasons" :key="reason">- {{ reason }}</p>
                  </div>

                  <div class="dashboard__attention-recommendation">
                    <div class="dashboard__attention-recommendation-label">建议动作</div>
                    <div class="dashboard__attention-recommendation-title">
                      {{ item.recommendedAction.label }}
                    </div>
                    <div class="dashboard__attention-recommendation-desc">
                      {{ item.recommendedAction.description }}
                    </div>
                  </div>

                  <div class="dashboard__attention-meta">
                    <span>最近入库 {{ formatDateTime(item.source.lastCrawled) }}</span>
                    <span>最近校验 {{ formatDateTime(item.source.lastCheckedAt) }}</span>
                  </div>

                  <div class="dashboard__attention-actions">
                    <div class="dashboard__attention-hint">
                      可定位到来源卡片，也可直接打开该来源的播放源列表
                    </div>
                    <div class="dashboard__attention-links">
                      <router-link
                        v-if="item.recommendedAction.target === 'crawler'"
                        :to="buildCrawlerSourceLink(item.source.name, 'attention')"
                        class="dashboard__link-btn dashboard__link-btn--warning"
                      >
                        先看来源策略
                      </router-link>
                      <router-link
                        v-else
                        :to="buildAdminPlaySourcesLink(item.source.name, 'attention')"
                        class="dashboard__link-btn dashboard__link-btn--danger"
                      >
                        先看播放源
                      </router-link>
                      <router-link
                        v-if="item.recommendedAction.target === 'crawler'"
                        :to="buildAdminPlaySourcesLink(item.source.name, 'attention')"
                        class="dashboard__link-btn dashboard__link-btn--secondary"
                      >
                        再看播放源
                      </router-link>
                      <router-link
                        v-else
                        :to="buildCrawlerSourceLink(item.source.name, 'attention')"
                        class="dashboard__link-btn dashboard__link-btn--secondary"
                      >
                        再看来源策略
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="dashboard__empty-state dashboard__empty-state--success">
                当前没有需要优先关注的来源，稳定性表现良好。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="dashboard__error-state">
      <div class="dashboard__error-content">
        <div>
          <h3 class="dashboard__error-title">稳定源采集监控暂不可用</h3>
          <p class="dashboard__error-message">
            {{ collectionError || '当前未获取到真实采集统计数据。' }}
          </p>
        </div>
        <router-link to="/admin/crawler" class="dashboard__link-btn dashboard__link-btn--warning">
          打开爬虫管理
        </router-link>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="dashboard__bottom-grid">
      <!-- 最近管理活动 -->
      <div class="dashboard__activity-section">
        <div class="dashboard__section-header">
          <h3 class="dashboard__section-title">最近管理活动</h3>
        </div>
        <div>
          <div v-if="loading" class="dashboard__loading-state">
            <div class="dashboard__spinner dashboard__spinner--small"></div>
            <p class="dashboard__loading-text">加载中...</p>
          </div>
          <div v-else-if="stats.recentActivity.length > 0" class="dashboard__activity-list">
            <div v-for="log in stats.recentActivity" :key="log.id" class="dashboard__activity-item">
              <div class="dashboard__activity-content">
                <div
                  :class="[
                    'dashboard__activity-dot',
                    log.status === 'success'
                      ? 'dashboard__activity-dot--success'
                      : log.status === 'error'
                        ? 'dashboard__activity-dot--error'
                        : 'dashboard__activity-dot--warning',
                  ]"
                ></div>
                <div class="dashboard__activity-info">
                  <p class="dashboard__activity-text">
                    {{ getActionText(log.action) }} - {{ getResourceText(log.resource) }}
                  </p>
                  <p class="dashboard__activity-time">{{ formatDate(log.createdAt) }}</p>
                  <p v-if="log.description" class="dashboard__activity-desc">
                    {{ log.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="dashboard__empty-activity">
            <p class="dashboard__empty-text">暂无管理活动记录</p>
          </div>
        </div>
      </div>

      <!-- 系统健康状态 -->
      <div class="dashboard__health-section">
        <div class="dashboard__section-header">
          <h3 class="dashboard__section-title">系统状态</h3>
        </div>
        <div class="dashboard__health-content">
          <div v-if="healthLoading" class="dashboard__loading-state">
            <div class="dashboard__spinner dashboard__spinner--small"></div>
            <p class="dashboard__loading-text">检测中...</p>
          </div>
          <div v-else-if="health" class="dashboard__health-items">
            <div class="dashboard__health-item">
              <span class="dashboard__health-label">服务状态</span>
              <span
                :class="[
                  'dashboard__health-badge',
                  health.status === 'ok'
                    ? 'dashboard__health-badge--success'
                    : 'dashboard__health-badge--error',
                ]"
              >
                {{ health.status === 'ok' ? '正常' : '异常' }}
              </span>
            </div>
            <div class="dashboard__health-item">
              <span class="dashboard__health-label">运行时间</span>
              <span class="dashboard__health-value">{{ formatUptime(health.uptime) }}</span>
            </div>
            <div class="dashboard__health-item">
              <span class="dashboard__health-label">内存使用</span>
              <span class="dashboard__health-value">{{ formatMemory(health.memory) }}</span>
            </div>
            <div v-if="danmakuHealth" class="dashboard__danmaku-health">
              <div class="dashboard__danmaku-title">弹幕运行态</div>
              <div class="dashboard__danmaku-stats">
                <div class="dashboard__danmaku-stat">
                  <div class="dashboard__danmaku-label">活跃房间</div>
                  <div class="dashboard__danmaku-value">
                    {{ danmakuHealth.performance.activeRooms }}
                  </div>
                </div>
                <div class="dashboard__danmaku-stat">
                  <div class="dashboard__danmaku-label">在线连接</div>
                  <div class="dashboard__danmaku-value">
                    {{ danmakuHealth.performance.activeConnections }}
                  </div>
                </div>
                <div class="dashboard__danmaku-stat">
                  <div class="dashboard__danmaku-label">消息数</div>
                  <div class="dashboard__danmaku-value">
                    {{ danmakuHealth.performance.totalMessages }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="dashboard__health-error">
            <p class="dashboard__health-error-text">无法获取系统状态</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { adminApi, type AdminDanmakuHealthStatus } from '@/api/admin';
  import { crawlerApi, type CollectionStatistics } from '@/api/crawler';
  import {
    schedulerApi,
    type DailySourceCollectionDashboardSummary,
    type DailySourceCollectionIssueSource,
    type DailySourceCollectionRunRecord,
    type DailySourceCollectionRunSummary,
  } from '@/api/scheduler';
  import { log } from '@/utils/logger';
  import {
    buildAttentionSourceItem,
    compareAttentionSources,
    getAlertFilterRecommendedAction,
    getHoursSince,
    type AlertActionTarget,
    type AttentionSourceItem,
    type CrawlerAlertFilter,
  } from '@/utils/collection-source-alerts';

  interface AdminLogItem {
    id?: number;
    action?: string;
    resource?: string;
    status?: 'success' | 'error' | 'warning';
    description?: string;
    errorMessage?: string;
    createdAt?: string;
  }

  interface HealthStatus {
    status: 'ok' | 'error' | string;
    timestamp: string;
    uptime: number;
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  }

  const statCards = computed(() => [
    {
      label: '用户总数',
      value: stats.value.userCount,
      icon: '👥',
      iconBg: 'dashboard__stat-icon--blue',
    },
    {
      label: '媒体资源',
      value: stats.value.mediaCount,
      icon: '🎬',
      iconBg: 'dashboard__stat-icon--emerald',
    },
    {
      label: '播放源',
      value: stats.value.playSourceCount,
      icon: '🔗',
      iconBg: 'dashboard__stat-icon--purple',
    },
    {
      label: '观看历史',
      value: stats.value.watchHistoryCount,
      icon: '🕘',
      iconBg: 'dashboard__stat-icon--amber',
    },
  ]);

  // 状态管理
  const stats = ref({
    userCount: 0,
    mediaCount: 0,
    playSourceCount: 0,
    watchHistoryCount: 0,
    recentActivity: [] as AdminLogItem[],
  });

  const loading = ref(false);
  const health = ref<HealthStatus | null>(null);
  const danmakuHealth = ref<AdminDanmakuHealthStatus | null>(null);
  const healthLoading = ref(false);
  const collectionStatistics = ref<CollectionStatistics | null>(null);
  const collectionLoading = ref(false);
  const collectionError = ref('');
  const dailySummary = ref<DailySourceCollectionRunSummary | null>(null);
  const dailySummaryLoading = ref(false);
  const dailySummaryError = ref('');
  const taskDashboard = ref<DailySourceCollectionDashboardSummary | null>(null);
  const taskDashboardLoading = ref(false);
  const taskDashboardError = ref('');
  const taskActionLoading = ref(false);

  const topCollectionSources = computed(
    () => collectionStatistics.value?.sources.slice(0, 4) ?? [],
  );
  const recentTaskRuns = computed<DailySourceCollectionRunRecord[]>(
    () => taskDashboard.value?.history ?? [],
  );
  const taskIssueSources = computed<DailySourceCollectionIssueSource[]>(
    () => taskDashboard.value?.issueSources ?? [],
  );
  const taskMetrics = computed(
    () =>
      taskDashboard.value?.metrics ?? {
        totalRuns: 0,
        successfulRuns: 0,
        errorRuns: 0,
        skippedRuns: 0,
        manualRuns: 0,
        scheduledRuns: 0,
        successRate: 0,
        averageDurationMs: 0,
        averageAttempted: 0,
        averageCreatedMedia: 0,
        averageCreatedPlaySources: 0,
        lastSuccessAt: undefined,
        lastErrorAt: undefined,
        failureStreak: 0,
      },
  );
  const isTaskRunPending = computed(
    () => taskActionLoading.value || dailySummary.value?.status === 'running',
  );
  const attentionCollectionCandidates = computed<AttentionSourceItem[]>(() => {
    const sources = collectionStatistics.value?.sources ?? [];

    return sources
      .map(source => buildAttentionSourceItem(source))
      .filter((item): item is AttentionSourceItem => item !== null)
      .sort(compareAttentionSources);
  });
  const attentionCollectionSources = computed(() =>
    attentionCollectionCandidates.value.slice(0, 4),
  );
  const attentionSummary = computed(() => {
    const candidates = attentionCollectionCandidates.value;

    return {
      total: candidates.length,
      criticalCount: candidates.filter(item => item.severity === 'critical').length,
      highCount: candidates.filter(item => item.severity === 'high').length,
      stalledIngestionCount: candidates.filter(item => {
        const hoursSinceLastCrawled = getHoursSince(item.source.lastCrawled);
        return (
          item.source.dailyEnabled &&
          (hoursSinceLastCrawled === null || hoursSinceLastCrawled >= 168)
        );
      }).length,
      noActiveSourcesCount: candidates.filter(
        item => item.source.totalPlaySources > 0 && item.source.activePlaySources === 0,
      ).length,
    };
  });

  // 加载统计数据
  const loadStats = async () => {
    loading.value = true;
    try {
      stats.value = await adminApi.getStats();
    } catch (error) {
      log.error('AdminDashboard', '加载统计数据失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 加载系统健康状态
  const loadHealth = async () => {
    healthLoading.value = true;
    try {
      const [systemHealth, nextDanmakuHealth] = await Promise.all([
        adminApi.getHealth(),
        adminApi.getDanmakuHealth(),
      ]);
      health.value = systemHealth;
      danmakuHealth.value = nextDanmakuHealth;
    } catch (error) {
      log.error('AdminDashboard', '加载系统状态失败:', error);
      health.value = null;
      danmakuHealth.value = null;
    } finally {
      healthLoading.value = false;
    }
  };

  const loadCollectionStatistics = async () => {
    collectionLoading.value = true;
    collectionError.value = '';

    try {
      const response = await crawlerApi.getStatistics();
      if (response.data) {
        collectionStatistics.value = response.data;
      } else {
        collectionError.value = '当前暂无真实采集统计结果。';
      }
    } catch (error) {
      log.error('AdminDashboard', '加载稳定源采集监控失败:', error);
      collectionError.value = collectionStatistics.value
        ? '统计刷新失败，当前显示最近一次成功结果。'
        : '加载真实采集统计失败，请稍后重试。';
    } finally {
      collectionLoading.value = false;
    }
  };

  const loadDailySummary = async () => {
    dailySummaryLoading.value = true;
    dailySummaryError.value = '';

    try {
      dailySummary.value = await schedulerApi.getDailySourceCollectionSummary();
    } catch (error) {
      log.error('AdminDashboard', '加载每日采集任务状态失败:', error);
      dailySummaryError.value = dailySummary.value
        ? '任务状态刷新失败，当前显示最近一次成功结果。'
        : '加载每日采集任务状态失败，请稍后重试。';
    } finally {
      dailySummaryLoading.value = false;
    }
  };

  const loadTaskDashboard = async () => {
    taskDashboardLoading.value = true;
    taskDashboardError.value = '';

    try {
      const nextTaskDashboard = await schedulerApi.getDailySourceCollectionDashboard();

      if (
        nextTaskDashboard &&
        typeof nextTaskDashboard === 'object' &&
        'current' in nextTaskDashboard
      ) {
        taskDashboard.value = nextTaskDashboard;
        dailySummary.value = nextTaskDashboard.current;
      } else {
        taskDashboard.value = null;
      }
    } catch (error) {
      log.error('AdminDashboard', '加载任务结果看板失败:', error);
      taskDashboardError.value = taskDashboard.value
        ? '任务看板刷新失败，当前保留最近一次成功结果。'
        : '加载任务看板失败，请稍后重试。';
    } finally {
      taskDashboardLoading.value = false;
    }
  };

  const triggerDailyCollectionRun = async () => {
    if (isTaskRunPending.value) {
      return;
    }

    taskActionLoading.value = true;
    taskDashboardError.value = '';
    dailySummaryError.value = '';

    try {
      dailySummary.value = await schedulerApi.runDailySourceCollection();
      await loadTaskDashboard();
    } catch (error) {
      log.error('AdminDashboard', '手动触发每日采集任务失败:', error);
      taskDashboardError.value =
        error instanceof Error ? error.message : '手动触发每日采集任务失败，请稍后重试。';
    } finally {
      taskActionLoading.value = false;
    }
  };

  // 获取操作文本
  const getActionText = (action?: string) => {
    const actionMap = {
      create: '创建',
      update: '更新',
      delete: '删除',
      read: '查看',
      login: '登录',
      logout: '退出',
      export: '导出',
      import: '导入',
    };
    return action ? actionMap[action as keyof typeof actionMap] || action : '';
  };

  // 获取资源文本
  const getResourceText = (resource?: string) => {
    const resourceMap = {
      user: '用户',
      media_resource: '媒体资源',
      play_source: '播放源',
      watch_history: '观看历史',
      recommendation: '推荐',
      admin_role: '管理员角色',
      admin_permission: '管理员权限',
      admin_log: '管理日志',
    };
    return resource ? resourceMap[resource as keyof typeof resourceMap] || resource : '';
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('zh-CN') +
      ' ' +
      date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  // 格式化运行时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  // 格式化内存使用
  const formatMemory = (memory: HealthStatus['memory']) => {
    const mb = Math.round(memory.rss / 1024 / 1024);
    const heapUsed = Math.round(memory.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memory.heapTotal / 1024 / 1024);

    return `${heapUsed}MB / ${heapTotal}MB (RSS: ${mb}MB)`;
  };

  // 格式化日期时间
  const formatDateTime = (timestamp?: string | null) => {
    if (!timestamp) return '暂无';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return '暂无';
    }

    return parsed.toLocaleString('zh-CN');
  };

  const getQualityBadgeClass = (qualityScore: number) => {
    if (qualityScore >= 85) {
      return 'dashboard__badge--success';
    }

    if (qualityScore >= 70) {
      return 'dashboard__badge--warning';
    }

    return 'dashboard__badge--error';
  };

  const getDailyStatusText = (status?: DailySourceCollectionRunSummary['status']) => {
    const statusTextMap: Record<DailySourceCollectionRunSummary['status'], string> = {
      idle: '待运行',
      running: '执行中',
      success: '执行成功',
      error: '执行异常',
      skipped: '已跳过',
    };

    return status ? statusTextMap[status] : '待运行';
  };

  const getDailyStatusClass = (status?: DailySourceCollectionRunSummary['status']) => {
    switch (status) {
      case 'success':
        return 'dashboard__badge--success';
      case 'running':
        return 'dashboard__badge--info';
      case 'skipped':
        return 'dashboard__badge--warning';
      case 'error':
        return 'dashboard__badge--error';
      default:
        return 'dashboard__badge--neutral';
    }
  };

  const getTriggerText = (trigger?: DailySourceCollectionRunSummary['trigger']) => {
    return trigger === 'manual' ? '手动触发' : '定时触发';
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs || durationMs <= 0) {
      return '0秒';
    }

    const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return minutes > 0 ? `${minutes}分${seconds}秒` : `${totalSeconds}秒`;
  };

  const getAttentionBadgeClass = (severity: AttentionSourceItem['severity']) => {
    if (severity === 'critical') {
      return 'dashboard__badge--critical';
    }

    return severity === 'high' ? 'dashboard__badge--warning' : 'dashboard__badge--info';
  };

  const getAttentionLabel = (severity: AttentionSourceItem['severity']) => {
    if (severity === 'critical') {
      return '立即止损';
    }

    return severity === 'high' ? '优先处理' : '持续关注';
  };

  const getAttentionScoreClass = (score: number) => {
    if (score >= 10) {
      return 'dashboard__score--critical';
    }

    if (score >= 6) {
      return 'dashboard__score--warning';
    }

    return 'dashboard__score--info';
  };

  const buildCrawlerAlertLink = (alertFilter: CrawlerAlertFilter) => {
    return {
      name: 'admin-crawler',
      query: {
        alertFilter,
      },
    };
  };

  const buildAdminPlaySourcesAlertLink = (alertFilter: CrawlerAlertFilter) => {
    return {
      name: 'admin-play-sources',
      query: {
        alertFilter,
      },
    };
  };

  const getSummaryActionClass = (
    alertFilter: CrawlerAlertFilter,
    target: AlertActionTarget,
    tone: 'rose' | 'amber' | 'sky' | 'fuchsia',
  ) => {
    const recommendedTarget = getAlertFilterRecommendedAction(alertFilter).target;
    const isRecommended = recommendedTarget === target;

    return [
      'dashboard__action-btn',
      isRecommended
        ? `dashboard__action-btn--recommended dashboard__action-btn--${tone}`
        : 'dashboard__action-btn--secondary',
    ];
  };

  const getSummaryActionLabel = (
    alertFilter: CrawlerAlertFilter,
    target: AlertActionTarget,
    fallbackLabel: string,
  ) => {
    return getAlertFilterRecommendedAction(alertFilter).target === target
      ? `建议 · ${fallbackLabel}`
      : fallbackLabel;
  };

  const buildCrawlerSourceLink = (sourceName: string, focus: 'top' | 'attention') => {
    return {
      name: 'admin-crawler',
      query: {
        source: sourceName,
        focus,
      },
    };
  };

  const buildAdminPlaySourcesLink = (sourceName: string, focus: 'top' | 'attention') => {
    return {
      name: 'admin-play-sources',
      query: {
        source: sourceName,
        focus,
      },
    };
  };

  let statsInterval: ReturnType<typeof setInterval> | null = null;
  let healthInterval: ReturnType<typeof setInterval> | null = null;

  // 组件挂载时加载数据
  onMounted(() => {
    void loadStats();
    void loadHealth();
    void loadCollectionStatistics();
    void loadDailySummary();
    void loadTaskDashboard();

    statsInterval = setInterval(() => {
      void loadStats();
      void loadCollectionStatistics();
      void loadDailySummary();
      void loadTaskDashboard();
    }, 30000);
    healthInterval = setInterval(() => {
      void loadHealth();
    }, 60000);
  });

  onUnmounted(() => {
    if (statsInterval) clearInterval(statsInterval);
    if (healthInterval) clearInterval(healthInterval);
  });
</script>

<style scoped>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }

  .dashboard__header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .dashboard__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  .dashboard__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .dashboard__stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }

  @media (max-width: 1024px) {
    .dashboard__stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .dashboard__stats-grid {
      grid-template-columns: 1fr;
    }
  }

  .dashboard__stat-card {
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-primary);
    background-color: var(--bg-card);
    padding: var(--spacing-4);
  }

  .dashboard__stat-inner {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }

  .dashboard__stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--radius-lg);
    font-size: var(--font-size-lg);
  }

  .dashboard__stat-icon--blue {
    background-color: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .dashboard__stat-icon--emerald {
    background-color: rgba(16, 185, 129, 0.15);
    color: #34d399;
  }

  .dashboard__stat-icon--purple {
    background-color: rgba(139, 92, 246, 0.15);
    color: #a78bfa;
  }

  .dashboard__stat-icon--amber {
    background-color: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
  }

  .dashboard__stat-label {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .dashboard__stat-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-top: var(--spacing-1);
  }

  .dashboard__loading-card {
    border-radius: var(--radius-2xl);
    border: 1px solid var(--border-primary);
    background-color: var(--bg-card);
    padding: var(--spacing-12) var(--spacing-6);
    text-align: center;
  }

  .dashboard__loading-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-4);
  }

  .dashboard__spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid var(--border-primary);
    border-top-color: var(--color-brand-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .dashboard__spinner--small {
    width: 1.5rem;
    height: 1.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .dashboard__loading-text {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .dashboard__monitor {
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius-2xl);
    background-color: #0f172a;
    box-shadow: var(--shadow-xl);
    outline: 1px solid #1e293b;
  }

  .dashboard__monitor-header {
    background:
      radial-gradient(circle at top left, rgba(99, 102, 241, 0.26), transparent 36%),
      radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), transparent 32%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92));
    padding: var(--spacing-6);
    color: white;
  }

  @media (min-width: 1024px) {
    .dashboard__monitor-header {
      padding: var(--spacing-8);
    }
  }

  .dashboard__monitor-header-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
    min-width: 0;
  }

  @media (min-width: 1280px) {
    .dashboard__monitor-header-content {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .dashboard__monitor-info {
    max-width: 42rem;
    min-width: 0;
  }

  .dashboard__monitor-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-1) var(--spacing-3);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    letter-spacing: 0.05em;
    color: #e2e8f0;
  }

  .dashboard__monitor-title {
    margin-top: var(--spacing-4);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    line-height: 1.25;
    color: white;
  }

  .dashboard__monitor-desc {
    margin-top: var(--spacing-3);
    font-size: var(--font-size-sm);
    line-height: 1.625;
    color: #cbd5e1;
    overflow-wrap: anywhere;
  }

  .dashboard__monitor-error {
    margin-top: var(--spacing-3);
    font-size: var(--font-size-xs);
    color: rgba(253, 230, 138, 0.9);
  }

  .dashboard__monitor-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
  }

  @media (min-width: 640px) {
    .dashboard__monitor-stats {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  @media (min-width: 1280px) {
    .dashboard__monitor-stats {
      min-width: 520px;
      max-width: 560px;
    }
  }

  .dashboard__monitor-stat {
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-4);
    backdrop-filter: blur(8px);
  }

  .dashboard__monitor-stat-label {
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__monitor-stat-value {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: white;
  }

  .dashboard__monitor-stat-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__monitor-body {
    margin-top: var(--spacing-6);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
    min-width: 0;
  }

  @media (min-width: 1280px) {
    .dashboard__monitor-body {
      grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
    }
  }

  .dashboard__monitor-panel {
    min-width: 0;
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-5);
    backdrop-filter: blur(8px);
  }

  @media (max-width: 640px) {
    .dashboard__monitor-header,
    .dashboard__monitor-panel {
      padding: var(--spacing-4);
    }

    .dashboard__monitor-body {
      gap: var(--spacing-3);
    }
  }

  .dashboard__monitor-panel-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    min-width: 0;
  }

  @media (min-width: 640px) {
    .dashboard__monitor-panel-header {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .dashboard__monitor-panel-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: white;
  }

  .dashboard__monitor-panel-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: #94a3b8;
    overflow-wrap: anywhere;
  }

  .dashboard__link-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    min-height: var(--touch-target);
    border-radius: 9999px;
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
  }

  .dashboard__link-btn--primary {
    border: 1px solid rgba(129, 140, 248, 0.3);
    background-color: rgba(99, 102, 241, 0.1);
    color: #c7d2fe;
  }

  .dashboard__link-btn--primary:hover {
    background-color: rgba(99, 102, 241, 0.2);
  }

  .dashboard__link-btn--success {
    border: 1px solid rgba(52, 211, 153, 0.3);
    background-color: rgba(16, 185, 129, 0.1);
    color: #a7f3d0;
  }

  .dashboard__link-btn--success:hover {
    background-color: rgba(16, 185, 129, 0.2);
  }

  .dashboard__link-btn--warning {
    border: 1px solid rgba(251, 191, 36, 0.3);
    background-color: rgba(245, 158, 11, 0.1);
    color: #fde68a;
  }

  .dashboard__link-btn--warning:hover {
    background-color: rgba(245, 158, 11, 0.2);
  }

  .dashboard__link-btn--danger {
    border: 1px solid rgba(251, 113, 133, 0.3);
    background-color: rgba(239, 68, 68, 0.1);
    color: #fecdd3;
  }

  .dashboard__link-btn--danger:hover {
    background-color: rgba(239, 68, 68, 0.2);
  }

  .dashboard__link-btn--secondary {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }

  .dashboard__link-btn--secondary:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dashboard__info-grid {
    margin-top: var(--spacing-5);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }

  @media (min-width: 768px) {
    .dashboard__info-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .dashboard__info-card {
    min-width: 0;
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.4);
    padding: var(--spacing-4);
  }

  .dashboard__info-label {
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__info-value {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-sm);
    color: #e2e8f0;
  }

  .dashboard__task-section {
    min-width: 0;
    margin-top: var(--spacing-4);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.5);
    padding: var(--spacing-4);
  }

  .dashboard__task-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  @media (min-width: 640px) {
    .dashboard__task-header {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .dashboard__task-label {
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__task-status {
    margin-top: var(--spacing-2);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-2);
  }

  .dashboard__task-meta {
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__task-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: #e2e8f0;
    overflow-wrap: anywhere;
  }

  .dashboard__task-message {
    margin-top: var(--spacing-3);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__task-error {
    margin-top: var(--spacing-3);
    font-size: var(--font-size-xs);
    color: rgba(253, 230, 138, 0.9);
  }

  .dashboard__empty-state {
    margin-top: var(--spacing-4);
    border-radius: var(--radius-lg);
    border: 1px dashed rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.3);
    padding: var(--spacing-4);
    font-size: var(--font-size-sm);
    color: #94a3b8;
  }

  .dashboard__empty-state--success {
    border-color: rgba(52, 211, 153, 0.2);
    background-color: rgba(16, 185, 129, 0.1);
    color: #a7f3d0;
  }

  .dashboard__metrics-grid {
    margin-top: var(--spacing-4);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
  }

  @media (min-width: 1280px) {
    .dashboard__metrics-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .dashboard__metric-card {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.5);
    padding: var(--spacing-3);
  }

  .dashboard__metric-label {
    font-size: 11px;
    color: #64748b;
  }

  .dashboard__metric-value {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: white;
  }

  .dashboard__metric-desc {
    margin-top: var(--spacing-1);
    font-size: 11px;
    color: #94a3b8;
  }

  .dashboard__task-dashboard {
    min-width: 0;
    margin-top: var(--spacing-4);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.5);
    padding: var(--spacing-4);
  }

  .dashboard__task-dashboard-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    min-width: 0;
  }

  @media (min-width: 1024px) {
    .dashboard__task-dashboard-header {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .dashboard__task-actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
    min-width: 0;
  }

  .dashboard__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
    cursor: pointer;
  }

  .dashboard__btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .dashboard__btn--secondary {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    color: white;
  }

  .dashboard__btn--secondary:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dashboard__btn--success {
    border: 1px solid rgba(52, 211, 153, 0.3);
    background-color: rgba(16, 185, 129, 0.1);
    color: #a7f3d0;
  }

  .dashboard__btn--success:hover:not(:disabled) {
    background-color: rgba(16, 185, 129, 0.2);
  }

  .dashboard__task-results-grid {
    margin-top: var(--spacing-4);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
    min-width: 0;
  }

  @media (min-width: 1280px) {
    .dashboard__task-results-grid {
      grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
    }
  }

  .dashboard__task-results-panel {
    min-width: 0;
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.4);
    padding: var(--spacing-4);
  }

  .dashboard__task-results-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-3);
    min-width: 0;
  }

  .dashboard__task-runs-list {
    margin-top: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    min-width: 0;
  }

  .dashboard__task-run-card {
    min-width: 0;
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.4);
    padding: var(--spacing-4);
  }

  .dashboard__task-run-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    min-width: 0;
  }

  @media (min-width: 640px) {
    .dashboard__task-run-header {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  }

  .dashboard__task-run-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-2);
    min-width: 0;
  }

  .dashboard__task-run-message {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: #64748b;
    overflow-wrap: anywhere;
  }

  .dashboard__task-run-stats {
    margin-top: var(--spacing-3);
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: #cbd5e1;
    min-width: 0;
  }

  @media (max-width: 640px) {
    .dashboard__task-dashboard,
    .dashboard__task-results-panel,
    .dashboard__task-run-card {
      padding: var(--spacing-3);
    }
  }

  @media (min-width: 768px) {
    .dashboard__task-run-stats {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .dashboard__issue-sources-list {
    margin-top: var(--spacing-4);
    max-height: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    overflow-y: auto;
  }

  .dashboard__issue-source-card {
    border-radius: var(--radius-lg);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.4);
    padding: var(--spacing-4);
  }

  .dashboard__issue-source-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__issue-source-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: white;
  }

  .dashboard__issue-source-stats {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__issue-source-time {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__issue-source-error {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: rgba(253, 230, 138, 0.9);
  }

  .dashboard__sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .dashboard__sources-panel {
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-5);
    backdrop-filter: blur(8px);
  }

  .dashboard__sources-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__sources-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: white;
  }

  .dashboard__sources-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: #94a3b8;
  }

  .dashboard__sources-count {
    font-size: var(--font-size-xs);
    color: #64748b;
  }

  .dashboard__sources-list {
    margin-top: var(--spacing-4);
    max-height: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    overflow-y: auto;
  }

  .dashboard__source-card {
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.4);
    padding: var(--spacing-4);
  }

  .dashboard__source-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__source-info {
    min-width: 0;
  }

  .dashboard__source-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: white;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard__source-stats {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__source-meta {
    margin-top: var(--spacing-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-4);
    font-size: var(--font-size-xs);
    color: #cbd5e1;
  }

  .dashboard__source-actions {
    margin-top: var(--spacing-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__source-hint {
    font-size: 11px;
    color: #64748b;
  }

  .dashboard__source-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-2);
  }

  .dashboard__alerts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-3);
  }

  .dashboard__alert-card {
    border-radius: var(--radius-2xl);
    padding: var(--spacing-4);
    backdrop-filter: blur(8px);
  }

  .dashboard__alert-card--critical {
    border: 1px solid rgba(251, 113, 133, 0.2);
    background-color: rgba(239, 68, 68, 0.1);
  }

  .dashboard__alert-card--high {
    border: 1px solid rgba(251, 191, 36, 0.2);
    background-color: rgba(245, 158, 11, 0.1);
  }

  .dashboard__alert-card--stalled {
    border: 1px solid rgba(56, 189, 248, 0.2);
    background-color: rgba(14, 165, 233, 0.1);
  }

  .dashboard__alert-card--inactive {
    border: 1px solid rgba(232, 121, 249, 0.2);
    background-color: rgba(217, 70, 239, 0.1);
  }

  .dashboard__alert-label {
    font-size: var(--font-size-xs);
  }

  .dashboard__alert-card--critical .dashboard__alert-label {
    color: #fecdd3;
  }

  .dashboard__alert-card--high .dashboard__alert-label {
    color: #fde68a;
  }

  .dashboard__alert-card--stalled .dashboard__alert-label {
    color: #bae6fd;
  }

  .dashboard__alert-card--inactive .dashboard__alert-label {
    color: #f5d0fe;
  }

  .dashboard__alert-value {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: white;
  }

  .dashboard__alert-desc {
    margin-top: var(--spacing-1);
    font-size: 11px;
  }

  .dashboard__alert-card--critical .dashboard__alert-desc {
    color: rgba(254, 205, 211, 0.8);
  }

  .dashboard__alert-card--high .dashboard__alert-desc {
    color: rgba(253, 230, 138, 0.8);
  }

  .dashboard__alert-card--stalled .dashboard__alert-desc {
    color: rgba(186, 230, 253, 0.8);
  }

  .dashboard__alert-card--inactive .dashboard__alert-desc {
    color: rgba(245, 208, 254, 0.8);
  }

  .dashboard__alert-action-label {
    margin-top: var(--spacing-2);
    font-size: 11px;
  }

  .dashboard__alert-card--critical .dashboard__alert-action-label {
    color: rgba(254, 205, 211, 0.7);
  }

  .dashboard__alert-card--high .dashboard__alert-action-label {
    color: rgba(253, 230, 138, 0.7);
  }

  .dashboard__alert-card--stalled .dashboard__alert-action-label {
    color: rgba(186, 230, 253, 0.7);
  }

  .dashboard__alert-card--inactive .dashboard__alert-action-label {
    color: rgba(245, 208, 254, 0.7);
  }

  .dashboard__alert-actions {
    margin-top: var(--spacing-4);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }

  .dashboard__action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    padding: var(--spacing-1-5) var(--spacing-3);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
  }

  .dashboard__action-btn--recommended {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .dashboard__action-btn--recommended:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .dashboard__action-btn--rose {
    border-color: rgba(253, 224, 71, 0.3);
  }

  .dashboard__action-btn--amber {
    border-color: rgba(251, 191, 36, 0.3);
  }

  .dashboard__action-btn--sky {
    border-color: rgba(56, 189, 248, 0.3);
  }

  .dashboard__action-btn--fuchsia {
    border-color: rgba(232, 121, 249, 0.3);
  }

  .dashboard__action-btn--secondary {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }

  .dashboard__action-btn--secondary:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dashboard__attention-panel {
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-5);
    backdrop-filter: blur(8px);
  }

  .dashboard__attention-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__attention-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: white;
  }

  .dashboard__attention-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: #94a3b8;
  }

  .dashboard__attention-count {
    font-size: var(--font-size-xs);
    color: #64748b;
  }

  .dashboard__attention-list {
    margin-top: var(--spacing-4);
    max-height: 500px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
    overflow-y: auto;
  }

  .dashboard__attention-card {
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(15, 23, 42, 0.4);
    padding: var(--spacing-4);
  }

  .dashboard__attention-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__attention-source-info {
    min-width: 0;
  }

  .dashboard__attention-source-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: white;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard__attention-source-stats {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__attention-tags {
    margin-top: var(--spacing-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }

  .dashboard__score {
    border-radius: 9999px;
    padding: var(--spacing-1) var(--spacing-2-5);
    font-size: 11px;
    font-weight: var(--font-weight-medium);
  }

  .dashboard__score--critical {
    background-color: rgba(239, 68, 68, 0.15);
    color: #fecdd3;
  }

  .dashboard__score--warning {
    background-color: rgba(245, 158, 11, 0.15);
    color: #fde68a;
  }

  .dashboard__score--info {
    background-color: rgba(14, 165, 233, 0.15);
    color: #bae6fd;
  }

  .dashboard__highlight-tag {
    border-radius: 9999px;
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-1) var(--spacing-2-5);
    font-size: 11px;
    color: #cbd5e1;
    outline: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dashboard__attention-reasons {
    margin-top: var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    font-size: var(--font-size-xs);
    color: #cbd5e1;
  }

  .dashboard__attention-recommendation {
    margin-top: var(--spacing-4);
    border-radius: var(--radius-xl);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    padding: var(--spacing-3);
  }

  .dashboard__attention-recommendation-label {
    font-size: 11px;
    color: #94a3b8;
  }

  .dashboard__attention-recommendation-title {
    margin-top: var(--spacing-2);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: white;
  }

  .dashboard__attention-recommendation-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: #cbd5e1;
  }

  .dashboard__attention-meta {
    margin-top: var(--spacing-3);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-4);
    font-size: var(--font-size-xs);
    color: #94a3b8;
  }

  .dashboard__attention-actions {
    margin-top: var(--spacing-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-3);
  }

  .dashboard__attention-hint {
    font-size: 11px;
    color: #64748b;
  }

  .dashboard__attention-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-2);
  }

  .dashboard__badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: var(--spacing-1) var(--spacing-2-5);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    outline: 1px solid transparent;
  }

  .dashboard__badge--success {
    background-color: rgba(16, 185, 129, 0.15);
    color: #a7f3d0;
    outline-color: rgba(52, 211, 153, 0.3);
  }

  .dashboard__badge--warning {
    background-color: rgba(245, 158, 11, 0.15);
    color: #fde68a;
    outline-color: rgba(251, 191, 36, 0.3);
  }

  .dashboard__badge--error {
    background-color: rgba(239, 68, 68, 0.15);
    color: #fecdd3;
    outline-color: rgba(251, 113, 133, 0.3);
  }

  .dashboard__badge--info {
    background-color: rgba(14, 165, 233, 0.15);
    color: #bae6fd;
    outline-color: rgba(56, 189, 248, 0.3);
  }

  .dashboard__badge--neutral {
    background-color: rgba(100, 116, 139, 0.15);
    color: #e2e8f0;
    outline-color: rgba(148, 163, 184, 0.3);
  }

  .dashboard__badge--critical {
    background-color: rgba(239, 68, 68, 0.2);
    color: #fecdd3;
    outline-color: rgba(253, 224, 71, 0.4);
  }

  .dashboard__error-state {
    border-radius: var(--radius-2xl);
    border: 1px solid var(--color-warning);
    background-color: rgba(245, 158, 11, 0.05);
    padding: var(--spacing-5) var(--spacing-6);
    color: #92400e;
    box-shadow: var(--shadow-sm);
  }

  .dashboard__error-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  @media (min-width: 768px) {
    .dashboard__error-content {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .dashboard__error-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
  }

  .dashboard__error-message {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-sm);
    color: #b45309;
  }

  .dashboard__bottom-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-4);
  }

  @media (min-width: 1024px) {
    .dashboard__bottom-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .dashboard__activity-section,
  .dashboard__health-section {
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-primary);
    background-color: var(--bg-card);
  }

  .dashboard__section-header {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--border-primary);
  }

  .dashboard__section-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }

  .dashboard__loading-state {
    text-align: center;
    padding: var(--spacing-8);
  }

  .dashboard__activity-list {
    display: flex;
    flex-direction: column;
  }

  .dashboard__activity-item {
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 1px solid var(--border-primary);
  }

  .dashboard__activity-item:last-child {
    border-bottom: none;
  }

  .dashboard__activity-content {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-3);
  }

  .dashboard__activity-dot {
    margin-top: 2px;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dashboard__activity-dot--success {
    background-color: var(--color-success);
  }

  .dashboard__activity-dot--error {
    background-color: var(--color-error);
  }

  .dashboard__activity-dot--warning {
    background-color: var(--color-warning);
  }

  .dashboard__activity-info {
    min-width: 0;
    flex: 1;
  }

  .dashboard__activity-text {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .dashboard__activity-time {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .dashboard__activity-desc {
    margin-top: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }

  .dashboard__empty-activity {
    padding: var(--spacing-8);
    text-align: center;
  }

  .dashboard__empty-text {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .dashboard__health-content {
    padding: var(--spacing-4);
  }

  .dashboard__health-items {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .dashboard__health-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dashboard__health-label {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }

  .dashboard__health-value {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }

  .dashboard__health-badge {
    border-radius: 9999px;
    padding: var(--spacing-1) var(--spacing-2);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  .dashboard__health-badge--success {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success);
  }

  .dashboard__health-badge--error {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--color-error);
  }

  .dashboard__health-error {
    text-align: center;
    padding: var(--spacing-8);
  }

  .dashboard__health-error-text {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }

  .dashboard__danmaku-health {
    margin-top: var(--spacing-3);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(99, 102, 241, 0.2);
    background-color: rgba(99, 102, 241, 0.05);
    padding: var(--spacing-3);
  }

  .dashboard__danmaku-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-brand-primary);
  }

  .dashboard__danmaku-stats {
    margin-top: var(--spacing-2);
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-2);
  }

  .dashboard__danmaku-label {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  .dashboard__danmaku-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-top: var(--spacing-1);
  }
</style>
