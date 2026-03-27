<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p class="mt-2 text-gray-600">系统概览和关键数据统计</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- 用户总数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292 0 4.465 4.465 0 00.702-.052l4.335-3.511c.287-.268.508-.767.508-1.251V6.5a.5.5 0 00-2.249-.83L9.876 2.69a.5.5 0 00-1.752 0L2.25 5.67A.5.5 0 000 6.5v7.656a5.5 0 001.752 0l4.335 3.511a.5.5 0 001.752 0L21.75 14.33a.5.5 0 002.249-.83V6.5z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">用户总数</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ stats.userCount }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 媒体资源数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M7 12h10M7 16h10"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">媒体资源</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ stats.mediaCount }}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 播放源数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18l8.553-4.276A1 1 0 0015 8.618v-6.764a1 1 0 00-1.447-.894L5 10z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">播放源</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.playSourceCount }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 观看历史数 -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <svg
                  class="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">观看历史</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">
                    {{ stats.watchHistoryCount }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="collectionLoading && !collectionStatistics"
      class="rounded-2xl border border-slate-200 bg-white px-6 py-12 shadow-sm"
    >
      <div class="flex flex-col items-center justify-center text-center">
        <div class="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
        <p class="mt-3 text-sm text-slate-500">正在加载稳定源采集监控...</p>
      </div>
    </div>

    <div
      v-else-if="collectionStatistics"
      class="overflow-hidden rounded-2xl bg-slate-950 shadow-xl ring-1 ring-slate-800"
    >
      <div class="bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.26),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(15,23,42,0.92))] p-6 text-white lg:p-8">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div class="max-w-2xl">
            <span
              class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-slate-200"
            >
              稳定源采集监控
            </span>
            <h2 class="mt-4 text-2xl font-semibold leading-tight text-white">
              每日自动采集的可用稳定播放源，现在也能在后台首页直接看到
            </h2>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              这里汇总真实来源、已入库媒体、播放源活跃度、平均质量分，以及最近一次入库和校验时间，方便持续盯住影视聚合平台的稳定供给。
            </p>
            <p v-if="collectionError" class="mt-3 text-xs text-amber-200/90">
              {{ collectionError }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px] xl:max-w-[560px]">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div class="text-xs text-slate-400">启用来源</div>
              <div class="mt-2 text-2xl font-semibold text-white">
                {{ collectionStatistics.enabledSources }}
              </div>
              <div class="mt-1 text-xs text-slate-400">
                日采集 {{ collectionStatistics.dailyEnabledSources }} · 高质量
                {{ collectionStatistics.stableSources }}
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div class="text-xs text-slate-400">媒体入库</div>
              <div class="mt-2 text-2xl font-semibold text-white">
                {{ collectionStatistics.totalMedia }}
              </div>
              <div class="mt-1 text-xs text-slate-400">
                活跃媒体 {{ collectionStatistics.activeMedia }}
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div class="text-xs text-slate-400">播放源池</div>
              <div class="mt-2 text-2xl font-semibold text-white">
                {{ collectionStatistics.totalPlaySources }}
              </div>
              <div class="mt-1 text-xs text-slate-400">
                活跃 {{ collectionStatistics.activePlaySources }} · 近24h
                {{ collectionStatistics.recentPlaySources24h }}
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div class="text-xs text-slate-400">综合质量</div>
              <div class="mt-2 text-2xl font-semibold text-white">
                {{ collectionStatistics.averageQualityScore }}
              </div>
              <div class="mt-1 text-xs text-slate-400">
                平均可用率 {{ collectionStatistics.averageActiveRate }}%
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 class="text-base font-medium text-white">采集概览</h3>
                <p class="mt-1 text-sm text-slate-400">
                  按真实采集来源、入库媒体、稳定播放源质量综合统计
                </p>
              </div>
              <router-link
                to="/crawler"
                class="inline-flex items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20"
              >
                前往爬虫管理
              </router-link>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div class="text-xs text-slate-400">来源覆盖</div>
                <div class="mt-2 text-sm text-slate-200">
                  总来源 {{ collectionStatistics.totalSources }}，其中启用
                  {{ collectionStatistics.enabledSources }} 个，参与每日采集
                  {{ collectionStatistics.dailyEnabledSources }} 个。
                </div>
              </div>

              <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div class="text-xs text-slate-400">稳定性表现</div>
                <div class="mt-2 text-sm text-slate-200">
                  当前高质量来源 {{ collectionStatistics.stableSources }} 个，平均质量分
                  {{ collectionStatistics.averageQualityScore }}，平均可用率
                  {{ collectionStatistics.averageActiveRate }}%。
                </div>
              </div>

              <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div class="text-xs text-slate-400">最近入库</div>
                <div class="mt-2 text-sm text-slate-200">
                  {{ formatDateTime(collectionStatistics.latestCollectedAt) }}
                </div>
              </div>

              <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div class="text-xs text-slate-400">最近校验</div>
                <div class="mt-2 text-sm text-slate-200">
                  {{ formatDateTime(collectionStatistics.latestValidatedAt) }}
                </div>
              </div>
            </div>

            <div class="mt-4 rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div class="text-xs text-slate-400">每日自动采集任务</div>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                        getDailyStatusClass(dailySummary?.status),
                      ]"
                    >
                      {{ getDailyStatusText(dailySummary?.status) }}
                    </span>
                    <span v-if="dailySummary" class="text-xs text-slate-400">
                      {{ getTriggerText(dailySummary.trigger) }} ·
                      {{ formatDateTime(dailySummary.completedAt || dailySummary.startedAt) }}
                    </span>
                  </div>
                </div>
                <div v-if="dailySummary?.durationMs" class="text-xs text-slate-400">
                  耗时 {{ formatDuration(dailySummary.durationMs) }}
                </div>
              </div>

              <div
                v-if="dailySummaryLoading && !dailySummary"
                class="mt-4 rounded-lg border border-dashed border-white/10 bg-slate-900/30 p-4 text-sm text-slate-400"
              >
                正在加载任务状态...
              </div>

              <div v-else-if="dailySummary" class="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div class="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                  <div class="text-[11px] text-slate-500">总尝试</div>
                  <div class="mt-2 text-lg font-semibold text-white">
                    {{ dailySummary.totalAttempted }}
                  </div>
                </div>
                <div class="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                  <div class="text-[11px] text-slate-500">新建媒体 / 播放源</div>
                  <div class="mt-2 text-lg font-semibold text-white">
                    {{ dailySummary.totalCreatedMedia }} / {{ dailySummary.totalCreatedPlaySources }}
                  </div>
                </div>
                <div class="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                  <div class="text-[11px] text-slate-500">成功 / 失败</div>
                  <div class="mt-2 text-lg font-semibold text-white">
                    {{ dailySummary.totalSucceeded }} / {{ dailySummary.totalFailed }}
                  </div>
                </div>
                <div class="rounded-lg border border-white/10 bg-slate-950/50 p-3">
                  <div class="text-[11px] text-slate-500">校验通过</div>
                  <div class="mt-2 text-lg font-semibold text-white">
                    {{ dailySummary.validationSummary?.active || 0 }} /
                    {{ dailySummary.validationSummary?.checked || 0 }}
                  </div>
                </div>
              </div>

              <div v-else class="mt-4 rounded-lg border border-dashed border-white/10 bg-slate-900/30 p-4 text-sm text-slate-400">
                {{ dailySummaryError || '暂无每日自动采集执行记录。' }}
              </div>

              <p v-if="dailySummary?.message" class="mt-3 text-xs text-slate-400">
                {{ dailySummary.message }}
              </p>
              <p v-if="dailySummaryError && dailySummary" class="mt-3 text-xs text-amber-200/90">
                {{ dailySummaryError }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-medium text-white">重点来源</h3>
                  <p class="mt-1 text-sm text-slate-400">按质量分和可用率排序</p>
                </div>
                <span class="text-xs text-slate-500">Top {{ topCollectionSources.length }}</span>
              </div>

              <div v-if="topCollectionSources.length > 0" class="mt-4 space-y-3">
                <div
                  v-for="source in topCollectionSources"
                  :key="source.name"
                  class="rounded-xl border border-white/10 bg-slate-900/40 p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-medium text-white">{{ source.name }}</div>
                      <div class="mt-1 text-xs text-slate-400">
                        已入库 {{ source.totalCrawled }} · 活跃源 {{ source.activePlaySources }} /
                        {{ source.totalPlaySources }}
                      </div>
                    </div>
                    <span
                      :class="[
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                        getQualityBadgeClass(source.qualityScore),
                      ]"
                    >
                      质量 {{ source.qualityScore }}
                    </span>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-300">
                    <span>可用率 {{ source.activeRate }}%</span>
                    <span>代理 {{ source.proxyMode }}</span>
                    <span>最近入库 {{ formatDateTime(source.lastCrawled) }}</span>
                  </div>

                  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div class="text-[11px] text-slate-500">
                      可直接跳转到策略页或播放源页做进一步排障
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <router-link
                        :to="buildCrawlerSourceLink(source.name, 'top')"
                        class="inline-flex items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/20"
                      >
                        查看来源
                      </router-link>
                      <router-link
                        :to="buildAdminPlaySourcesLink(source.name, 'top')"
                        class="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20"
                      >
                        排查播放源
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-900/30 p-4 text-sm text-slate-400"
              >
                暂无可展示的来源统计，等待采集任务产出真实数据。
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <router-link
                :to="buildCrawlerAlertLink('critical')"
                class="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 backdrop-blur-sm transition hover:bg-rose-500/15"
              >
                <div class="text-xs text-rose-200">立即止损</div>
                <div class="mt-2 text-2xl font-semibold text-white">
                  {{ attentionSummary.criticalCount }}
                </div>
                <div class="mt-1 text-[11px] text-rose-100/80">高风险来源</div>
              </router-link>
              <router-link
                :to="buildCrawlerAlertLink('high')"
                class="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 backdrop-blur-sm transition hover:bg-amber-500/15"
              >
                <div class="text-xs text-amber-200">优先处理</div>
                <div class="mt-2 text-2xl font-semibold text-white">
                  {{ attentionSummary.highCount }}
                </div>
                <div class="mt-1 text-[11px] text-amber-100/80">中高风险来源</div>
              </router-link>
              <router-link
                :to="buildCrawlerAlertLink('stalled')"
                class="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 backdrop-blur-sm transition hover:bg-sky-500/15"
              >
                <div class="text-xs text-sky-200">入库停滞</div>
                <div class="mt-2 text-2xl font-semibold text-white">
                  {{ attentionSummary.stalledIngestionCount }}
                </div>
                <div class="mt-1 text-[11px] text-sky-100/80">超过 7 天无新入库</div>
              </router-link>
              <router-link
                :to="buildCrawlerAlertLink('inactive')"
                class="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4 backdrop-blur-sm transition hover:bg-fuchsia-500/15"
              >
                <div class="text-xs text-fuchsia-200">无活跃源</div>
                <div class="mt-2 text-2xl font-semibold text-white">
                  {{ attentionSummary.noActiveSourcesCount }}
                </div>
                <div class="mt-1 text-[11px] text-fuchsia-100/80">已失去可播能力</div>
              </router-link>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-base font-medium text-white">待关注来源</h3>
                  <p class="mt-1 text-sm text-slate-400">筛出低质量、低可用率或缺少校验的来源</p>
                </div>
                <span class="text-xs text-slate-500">{{ attentionSummary.total }} 项</span>
              </div>

              <div v-if="attentionCollectionSources.length > 0" class="mt-4 space-y-3">
                <div
                  v-for="item in attentionCollectionSources"
                  :key="item.source.name"
                  class="rounded-xl border border-white/10 bg-slate-900/40 p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-medium text-white">
                        {{ item.source.name }}
                      </div>
                      <div class="mt-1 text-xs text-slate-400">
                        质量 {{ item.source.qualityScore }} · 可用率 {{ item.source.activeRate }}%
                      </div>
                    </div>
                    <span
                      :class="[
                        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                        getAttentionBadgeClass(item.severity),
                      ]"
                    >
                      {{ getAttentionLabel(item.severity) }}
                    </span>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <span
                      :class="[
                        'rounded-full px-2.5 py-1 text-[11px] font-medium',
                        getAttentionScoreClass(item.score),
                      ]"
                    >
                      风险分 {{ item.score }}
                    </span>
                    <span
                      v-for="highlight in item.highlights"
                      :key="highlight"
                      class="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 ring-1 ring-white/10"
                    >
                      {{ highlight }}
                    </span>
                  </div>

                  <div class="mt-3 space-y-2 text-xs text-slate-300">
                    <p v-for="reason in item.reasons" :key="reason">- {{ reason }}</p>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                    <span>最近入库 {{ formatDateTime(item.source.lastCrawled) }}</span>
                    <span>最近校验 {{ formatDateTime(item.source.lastCheckedAt) }}</span>
                  </div>

                  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div class="text-[11px] text-slate-500">
                      可定位到来源卡片，也可直接打开该来源的播放源列表
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <router-link
                        :to="buildCrawlerSourceLink(item.source.name, 'attention')"
                        class="inline-flex items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
                      >
                        立即处理
                      </router-link>
                      <router-link
                        :to="buildAdminPlaySourcesLink(item.source.name, 'attention')"
                        class="inline-flex items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20"
                      >
                        查看源列表
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="mt-4 rounded-xl border border-dashed border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100"
              >
                当前没有需要优先关注的来源，稳定性表现良好。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-900 shadow-sm"
    >
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-base font-medium">稳定源采集监控暂不可用</h3>
          <p class="mt-1 text-sm text-amber-800">
            {{ collectionError || '当前未获取到真实采集统计数据。' }}
          </p>
        </div>
        <router-link
          to="/crawler"
          class="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
        >
          打开爬虫管理
        </router-link>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 最近管理活动 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">最近管理活动</h3>
        </div>
        <div class="border-t border-gray-200">
          <div v-if="loading" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
            <p class="mt-2 text-gray-500">加载中...</p>
          </div>
          <div v-else-if="stats.recentActivity.length > 0" class="px-4 py-5 sm:p-6">
            <ul class="divide-y divide-gray-200">
              <li v-for="log in stats.recentActivity" :key="log.id" class="py-4">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        log.status === 'success'
                          ? 'bg-green-100'
                          : log.status === 'error'
                            ? 'bg-red-100'
                            : 'bg-yellow-100',
                      ]"
                    >
                      <svg
                        class="w-5 h-5"
                        :class="[
                          log.status === 'success'
                            ? 'text-green-600'
                            : log.status === 'error'
                              ? 'text-red-600'
                              : 'text-yellow-600',
                        ]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          :d="
                            log.status === 'success'
                              ? 'M5 13l4 4L19 7'
                              : log.status === 'error'
                                ? 'M6 18L18 6M6 6l12 12'
                                : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 3.035-1.666 3.035-3.657 0 1.337-.645 3.228-2.42 3.228-3.657z'
                          "
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900">
                      {{ getActionText(log.action) }} - {{ getResourceText(log.resource) }}
                    </p>
                    <p class="text-sm text-gray-500">{{ formatDate(log.createdAt) }}</p>
                    <p v-if="log.description" class="text-sm text-gray-600 mt-1">
                      {{ log.description }}
                    </p>
                    <p
                      v-if="log.status === 'error' && log.errorMessage"
                      class="text-sm text-red-600 mt-1"
                    >
                      {{ log.errorMessage }}
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div v-else class="px-4 py-5 sm:p-6 text-center">
            <p class="text-gray-500">暂无管理活动记录</p>
          </div>
        </div>
      </div>

      <!-- 系统健康状态 -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900">系统状态</h3>
        </div>
        <div class="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div v-if="healthLoading" class="text-center py-8">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
            <p class="mt-2 text-gray-500">检测中...</p>
          </div>
          <div v-else-if="health" class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">服务状态</span>
              <span
                :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  health.status === 'ok'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800',
                ]"
              >
                {{ health.status === 'ok' ? '正常' : '异常' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">运行时间</span>
              <span class="text-sm text-gray-600">{{ formatUptime(health.uptime) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">内存使用</span>
              <span class="text-sm text-gray-600">{{ formatMemory(health.memory) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-900">检查时间</span>
              <span class="text-sm text-gray-600">{{ formatDateTime(health.timestamp) }}</span>
            </div>
          </div>
          <div v-else class="text-center">
            <p class="text-red-600">无法获取系统状态</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { adminApi } from '@/api/admin';
  import {
    crawlerApi,
    type CollectionStatistics,
  } from '@/api/crawler';
  import { schedulerApi, type DailySourceCollectionRunSummary } from '@/api/scheduler';
  import {
    buildAttentionSourceItem,
    compareAttentionSources,
    getHoursSince,
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
  const healthLoading = ref(false);
  const collectionStatistics = ref<CollectionStatistics | null>(null);
  const collectionLoading = ref(false);
  const collectionError = ref('');
  const dailySummary = ref<DailySourceCollectionRunSummary | null>(null);
  const dailySummaryLoading = ref(false);
  const dailySummaryError = ref('');

  const topCollectionSources = computed(() => collectionStatistics.value?.sources.slice(0, 4) ?? []);
  const attentionCollectionCandidates = computed<AttentionSourceItem[]>(() => {
    const sources = collectionStatistics.value?.sources ?? [];

    return sources
      .map(source => buildAttentionSourceItem(source))
      .filter((item): item is AttentionSourceItem => item !== null)
      .sort(compareAttentionSources);
  });
  const attentionCollectionSources = computed(() => attentionCollectionCandidates.value.slice(0, 4));
  const attentionSummary = computed(() => {
    const candidates = attentionCollectionCandidates.value;

    return {
      total: candidates.length,
      criticalCount: candidates.filter(item => item.severity === 'critical').length,
      highCount: candidates.filter(item => item.severity === 'high').length,
      stalledIngestionCount: candidates.filter(item => {
        const hoursSinceLastCrawled = getHoursSince(item.source.lastCrawled);
        return item.source.dailyEnabled && (hoursSinceLastCrawled === null || hoursSinceLastCrawled >= 168);
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
      console.error('加载统计数据失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 加载系统健康状态
  const loadHealth = async () => {
    healthLoading.value = true;
    try {
      health.value = await adminApi.getHealth();
    } catch (error) {
      console.error('加载系统状态失败:', error);
      health.value = null;
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
      console.error('加载稳定源采集监控失败:', error);
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
      console.error('加载每日采集任务状态失败:', error);
      dailySummaryError.value = dailySummary.value
        ? '任务状态刷新失败，当前显示最近一次成功结果。'
        : '加载每日采集任务状态失败，请稍后重试。';
    } finally {
      dailySummaryLoading.value = false;
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
    return actionMap[action] || action;
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
    return resourceMap[resource] || resource;
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
  const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return '暂无';

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return '暂无';
    }

    return parsed.toLocaleString('zh-CN');
  };

  const getQualityBadgeClass = (qualityScore: number) => {
    if (qualityScore >= 85) {
      return 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30';
    }

    if (qualityScore >= 70) {
      return 'bg-amber-500/15 text-amber-100 ring-amber-400/30';
    }

    return 'bg-rose-500/15 text-rose-100 ring-rose-400/30';
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
        return 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30';
      case 'running':
        return 'bg-sky-500/15 text-sky-100 ring-sky-400/30';
      case 'skipped':
        return 'bg-amber-500/15 text-amber-100 ring-amber-400/30';
      case 'error':
        return 'bg-rose-500/15 text-rose-100 ring-rose-400/30';
      default:
        return 'bg-slate-500/15 text-slate-100 ring-slate-400/30';
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

  const getHoursSince = (timestamp?: string | null) => {
    if (!timestamp) {
      return null;
    }

    const parsed = new Date(timestamp).getTime();
    if (Number.isNaN(parsed)) {
      return null;
    }

    return (Date.now() - parsed) / (1000 * 60 * 60);
  };

  const getAttentionBadgeClass = (severity: AttentionSourceItem['severity']) => {
    if (severity === 'critical') {
      return 'bg-rose-500/20 text-rose-100 ring-rose-300/40';
    }

    return severity === 'high'
      ? 'bg-amber-500/15 text-amber-100 ring-amber-400/30'
      : 'bg-sky-500/15 text-sky-100 ring-sky-400/30';
  };

  const getAttentionLabel = (severity: AttentionSourceItem['severity']) => {
    if (severity === 'critical') {
      return '立即止损';
    }

    return severity === 'high' ? '优先处理' : '持续关注';
  };

  const getAttentionScoreClass = (score: number) => {
    if (score >= 10) {
      return 'bg-rose-500/15 text-rose-100';
    }

    if (score >= 6) {
      return 'bg-amber-500/15 text-amber-100';
    }

    return 'bg-sky-500/15 text-sky-100';
  };

  const buildCrawlerAlertLink = (alertFilter: CrawlerAlertFilter) => {
    return {
      name: 'crawler',
      query: {
        alertFilter,
      },
    };
  };

  const buildCrawlerSourceLink = (sourceName: string, focus: 'top' | 'attention') => {
    return {
      name: 'crawler',
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

    // 定时刷新数据
    statsInterval = setInterval(() => {
      void loadStats();
      void loadCollectionStatistics();
      void loadDailySummary();
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
