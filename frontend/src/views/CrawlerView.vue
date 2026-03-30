<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">视频平台</router-link>
          </div>

          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-gray-900"> 首页 </router-link>
            <router-link to="/profile" class="text-gray-700 hover:text-gray-900">
              个人中心
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">爬虫管理</h1>
        <p class="text-gray-600 mt-1">管理和监控影视资源爬虫任务</p>
      </div>

      <div v-if="collectionStatistics" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-medium text-gray-900">采集概览</h2>
            <p class="mt-1 text-sm text-gray-600">基于真实入库媒体与播放源健康数据汇总</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">启用来源 / 总来源</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ collectionStatistics.enabledSources }} / {{ collectionStatistics.totalSources }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">日采集来源 / 高质量来源</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ collectionStatistics.dailyEnabledSources }} /
              {{ collectionStatistics.stableSources }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">已入库媒体 / 可用媒体</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ collectionStatistics.totalMedia }} / {{ collectionStatistics.activeMedia }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">播放源总量 / 活跃源</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ collectionStatistics.totalPlaySources }} /
              {{ collectionStatistics.activePlaySources }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">近24h新增源</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ collectionStatistics.recentPlaySources24h }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">平均质量 / 平均可用率</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ collectionStatistics.averageQualityScore }} /
              {{ collectionStatistics.averageActiveRate }}%
            </div>
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:gap-6">
          <span>最近入库: {{ formatDateTime(collectionStatistics.latestCollectedAt) }}</span>
          <span>最近校验: {{ formatDateTime(collectionStatistics.latestValidatedAt) }}</span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 class="text-lg font-medium text-gray-900">每日播放源采集任务</h2>
            <p class="mt-1 text-sm text-gray-600">查看最近执行情况，并支持手动触发采集</p>
          </div>
          <button
            :disabled="dailyRunning"
            class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            @click="runDailyCollection"
          >
            {{ dailyRunning ? '执行中...' : '立即执行一次' }}
          </button>
        </div>

        <div v-if="dailySummary" class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">状态</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">{{ dailySummary.status }}</div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">总尝试</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ dailySummary.totalAttempted }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">新建媒体 / 播放源</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ dailySummary.totalCreatedMedia }} / {{ dailySummary.totalCreatedPlaySources }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">播放源校验</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ dailySummary.validationSummary?.active || 0 }} /
              {{ dailySummary.validationSummary?.checked || 0 }}
            </div>
          </div>
          <div class="rounded-lg bg-gray-50 p-4">
            <div class="text-xs text-gray-500">因无可播链接跳过</div>
            <div class="mt-2 text-lg font-semibold text-gray-900">
              {{ dailySummary.totalSkippedNoPlayableUrls }}
            </div>
          </div>
        </div>

        <div
          v-if="dailySummary?.message"
          class="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800"
        >
          {{ dailySummary.message }}
        </div>
      </div>

      <!-- 爬虫目标列表 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900">可用爬虫目标</h2>
          <button
            :disabled="refreshing"
            class="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            @click="refreshTargets"
          >
            {{ refreshing ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <div
          v-if="focusedSourceName"
          class="mb-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-4 shadow-sm"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div
                class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
              >
                后台首页 · {{ getFocusOriginLabel() }}
              </div>
              <h3 class="mt-2 text-base font-semibold text-gray-900">
                当前聚焦来源：{{ focusedSourceName }}
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                已自动定位到该来源卡片，并同步填入快速爬取目标，方便直接检查策略、采集与稳定性。
              </p>
              <p v-if="focusedSourceStats" class="mt-2 text-xs text-gray-500">
                已入库 {{ focusedSourceStats.totalCrawled }} · 可用率
                {{ focusedSourceStats.activeRate }}% · 质量分
                {{ focusedSourceStats.qualityScore }}
              </p>
              <p v-if="focusedSourceStats" class="mt-1 text-xs text-gray-500">
                提取覆盖 {{ focusedSourceStats.extractionCoverage }}% · 近 7 天新增
                {{ focusedSourceStats.recentMedia7d }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <router-link
                :to="buildAdminPlaySourcesLink(focusedSourceName)"
                class="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                查看播放源
              </router-link>
              <button
                class="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="clearFocusedSource"
              >
                查看全部来源
              </button>
            </div>
          </div>
        </div>

        <div
          v-else-if="activeAlertFilter"
          class="mb-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-4 shadow-sm"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div
                class="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700"
              >
                后台首页 · 告警汇总
              </div>
              <h3 class="mt-2 text-base font-semibold text-gray-900">
                当前视图：{{ getAlertFilterLabel() }}
              </h3>
              <p class="mt-1 text-sm text-gray-600">
                已根据首页告警汇总卡片筛出对应来源，方便直接检查策略、采集和播放源稳定性。
              </p>
              <p class="mt-2 text-xs text-gray-500">
                当前命中 {{ filteredCrawlerTargets.length }} / {{ crawlerTargets.length }} 个来源。
              </p>
              <p v-if="getAlertFilterRecommendation()" class="mt-2 text-xs text-rose-700">
                {{ getAlertFilterRecommendation()?.label }} ·
                {{ getAlertFilterRecommendation()?.description }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <router-link
                :to="{ name: 'admin-dashboard', hash: '#dashboard-alert-summary' }"
                class="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white"
              >
                回到首页告警区
              </router-link>
              <router-link
                :to="{ name: 'crawler', query: { alertFilter: activeAlertFilter } }"
                :class="getAlertActionClass('crawler')"
              >
                {{ getAlertActionLabel('crawler', '当前来源视图') }}
              </router-link>
              <router-link
                :to="{ name: 'admin-play-sources', query: { alertFilter: activeAlertFilter } }"
                :class="getAlertActionClass('play-sources')"
              >
                {{ getAlertActionLabel('play-sources', '播放源视图') }}
              </router-link>
              <button
                class="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="clearAlertFilter"
              >
                查看全部来源
              </button>
            </div>
          </div>

          <div
            v-if="filteredCrawlerTargets.length > 0"
            class="mt-4 border-t border-rose-200 pt-4 text-sm text-gray-600"
          >
            <details class="group">
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-900"
              >
                <span>查看当前命中来源列表（{{ filteredCrawlerTargets.length }}）</span>
                <span class="text-xs text-gray-400 transition group-open:rotate-180">⌄</span>
              </summary>
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="target in filteredCrawlerTargets"
                  :key="target.name"
                  class="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                >
                  {{ target.name }}
                </span>
              </div>
            </details>
          </div>
        </div>

        <div v-if="targetsLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-2 text-gray-500">加载中...</p>
        </div>

        <div
          v-else-if="filteredCrawlerTargets.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="target in filteredCrawlerTargets"
            :key="target.name"
            :id="getSourceCardId(target.name)"
            :ref="element => setSourceCardRef(target.name, element)"
            :class="getSourceCardClass(target.name)"
          >
            <div
              v-if="isFocusedSource(target.name)"
              class="mb-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"
            >
              影院聚合焦点来源
            </div>
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-gray-900">{{ target.name }}</h3>
                <p class="text-sm text-gray-500 mt-1 truncate">{{ target.baseUrl }}</p>
                <div
                  v-if="getSourceHealth(target.name)"
                  class="mt-2 space-y-1 text-xs text-gray-600"
                >
                  <p>
                    质量分: {{ getSourceHealth(target.name)?.qualityScore }} · 可用率:
                    {{ getSourceHealth(target.name)?.activeRate }}%
                  </p>
                  <p>
                    日采集上限:
                    {{ getSourceHealth(target.name)?.dailyLimit }}
                  </p>
                  <p>
                    当前代理: {{ getSourceHealth(target.name)?.proxyMode }} · 建议代理:
                    {{ getSourceHealth(target.name)?.suggestedProxyMode }}
                  </p>
                  <p>
                    代理范围: {{ formatProxyTargets(getSourceHealth(target.name)) }}
                  </p>
                  <p>
                    提取覆盖: {{ getSourceHealth(target.name)?.extractionCoverage }}% · 近 7 天新增:
                    {{ getSourceHealth(target.name)?.recentMedia7d }}
                  </p>
                  <p class="text-[11px] text-gray-500">
                    分数组成: {{ formatQualityBreakdown(getSourceHealth(target.name)?.qualityBreakdown) }}
                  </p>
                  <p>
                    近24h新增源:
                    {{ getSourceHealth(target.name)?.recentPlaySources24h }}
                  </p>
                  <p>
                    已入库媒体:
                    {{ getCollectionSourceStats(target.name)?.totalCrawled || 0 }}
                  </p>
                  <p>
                    最近入库:
                    {{ formatDateTime(getCollectionSourceStats(target.name)?.lastCrawled) }}
                  </p>
                  <p class="text-[11px] text-gray-500">
                    {{ getSourceHealth(target.name)?.recommendation }}
                  </p>
                  <div
                    v-if="getSourceAttentionItem(target.name)"
                    class="mt-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3"
                  >
                    <div class="text-[11px] text-amber-700">建议动作</div>
                    <div class="mt-1 text-xs font-medium text-gray-900">
                      {{ getSourceAttentionItem(target.name)?.recommendedAction.label }}
                    </div>
                    <div class="mt-1 text-[11px] text-gray-600">
                      {{ getSourceAttentionItem(target.name)?.recommendedAction.description }}
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <router-link
                        :to="buildCrawlerSourceLink(target.name, 'attention')"
                        :class="getSourceActionClass(target.name, 'crawler')"
                      >
                        {{ getSourceActionLabel(target.name, 'crawler', '来源策略') }}
                      </router-link>
                      <router-link
                        :to="buildAdminPlaySourcesLink(target.name, 'attention')"
                        :class="getSourceActionClass(target.name, 'play-sources')"
                      >
                        {{ getSourceActionLabel(target.name, 'play-sources', '播放源排障') }}
                      </router-link>
                    </div>
                  </div>
                  <div class="mt-2 space-y-2 rounded bg-gray-50 p-2">
                    <label class="flex items-center gap-2">
                      <input
                        v-model="getPolicyDraft(target.name).dailyEnabled"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300"
                      />
                      <span>参与每日采集</span>
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                      <label class="flex flex-col gap-1">
                        <span>日采集上限</span>
                        <input
                          v-model.number="getPolicyDraft(target.name).dailyLimit"
                          type="number"
                          min="1"
                          class="rounded border border-gray-300 px-2 py-1"
                        />
                      </label>
                      <label class="flex flex-col gap-1">
                        <span>代理模式</span>
                        <select
                          v-model="getPolicyDraft(target.name).proxyMode"
                          class="rounded border border-gray-300 px-2 py-1"
                        >
                          <option value="direct">direct</option>
                          <option value="prefer-proxy">prefer-proxy</option>
                          <option value="proxy-required">proxy-required</option>
                        </select>
                      </label>
                    </div>
                    <div class="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <label class="flex items-center gap-2">
                        <input
                          v-model="getPolicyDraft(target.name).proxyForDiscovery"
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300"
                        />
                        <span>列表发现走代理</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input
                          v-model="getPolicyDraft(target.name).proxyForDetail"
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300"
                        />
                        <span>详情抓取走代理</span>
                      </label>
                      <label class="flex items-center gap-2">
                        <input
                          v-model="getPolicyDraft(target.name).proxyForConnectivityCheck"
                          type="checkbox"
                          class="h-4 w-4 rounded border-gray-300"
                        />
                        <span>连通检测走代理</span>
                      </label>
                    </div>
                    <label class="flex items-center gap-2">
                      <input
                        v-model="getPolicyDraft(target.name).requirePlayableUrls"
                        type="checkbox"
                        class="h-4 w-4 rounded border-gray-300"
                      />
                      <span>要求至少有可播放链接</span>
                    </label>
                    <div class="flex items-center justify-between gap-2">
                      <label class="flex items-center gap-2">
                        <span>最少链接数</span>
                        <input
                          v-model.number="getPolicyDraft(target.name).minimumPlayableUrls"
                          type="number"
                          min="0"
                          class="w-16 rounded border border-gray-300 px-2 py-1"
                        />
                      </label>
                      <button
                        :disabled="savingPolicyFor === target.name"
                        class="rounded bg-gray-900 px-2 py-1 text-white disabled:opacity-50"
                        @click="saveSourcePolicy(target.name)"
                      >
                        {{ savingPolicyFor === target.name ? '保存中...' : '保存策略' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs',
                  target.status === 'online'
                    ? 'bg-green-100 text-green-800'
                    : target.status === 'offline'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800',
                ]"
              >
                {{
                  target.status === 'online'
                    ? '在线'
                    : target.status === 'offline'
                      ? '离线'
                      : '未知'
                }}
              </span>
            </div>

            <div class="mt-4 flex space-x-2">
              <button
                :disabled="testingTarget === target.name"
                class="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 disabled:opacity-50"
                @click="testConnection(target.name)"
              >
                {{ testingTarget === target.name ? '测试中...' : '测试连接' }}
              </button>
              <button
                :disabled="collectingSource === target.name"
                class="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                @click="collectPopularFromSource(target.name)"
              >
                {{ collectingSource === target.name ? '采集中...' : '采集热门' }}
              </button>
              <button
                class="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                @click="crawlFromTarget(target.name)"
              >
                填入表单
              </button>
            </div>
          </div>
        </div>

        <div
          v-else
          class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500"
        >
          <div class="mx-auto max-w-md">
            <p>当前过滤条件下没有匹配来源，可返回查看全部来源或刷新后重试。</p>
            <p
              v-if="getAlertFilterRecommendation()"
              class="mt-3 rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-left text-sm text-rose-900"
            >
              <span class="block text-xs text-rose-700">建议动作</span>
              <span class="mt-1 block font-medium text-gray-900">
                {{ getAlertFilterRecommendation()?.label }}
              </span>
              <span class="mt-1 block text-[13px] text-gray-600">
                {{ getAlertFilterRecommendation()?.description }}
              </span>
            </p>
            <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                class="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="clearAlertFilter"
              >
                查看全部来源
              </button>
              <router-link
                v-if="activeAlertFilter"
                :to="{ name: 'admin-play-sources', query: { alertFilter: activeAlertFilter } }"
                :class="getAlertActionClass('play-sources')"
              >
                {{ getAlertActionLabel('play-sources', '播放源视图') }}
              </router-link>
            </div>
          </div>
        </div>

        <div
          v-if="sourceCollectionResult"
          class="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-900"
        >
          <div class="font-medium">来源 {{ sourceCollectionResult.sourceName }} 采集完成</div>
          <div class="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div>尝试: {{ sourceCollectionResult.attempted }}</div>
            <div>成功: {{ sourceCollectionResult.succeeded }}</div>
            <div>无可播跳过: {{ sourceCollectionResult.skippedNoPlayableUrls }}</div>
            <div>新建媒体: {{ sourceCollectionResult.createdMedia }}</div>
            <div>新建播放源: {{ sourceCollectionResult.createdPlaySources }}</div>
          </div>
          <div v-if="sourceCollectionResult.errors.length" class="mt-3 text-red-700">
            <div class="font-medium">错误摘要</div>
            <ul class="mt-1 list-disc pl-5">
              <li v-for="item in sourceCollectionResult.errors.slice(0, 5)" :key="item">
                {{ item }}
              </li>
            </ul>
          </div>
          <div
            v-if="getSourceAttentionItem(sourceCollectionResult.sourceName)"
            class="mt-4 rounded-lg border border-blue-200 bg-white p-4"
          >
            <div class="text-xs text-blue-600">建议动作</div>
            <div class="mt-2 text-sm font-medium text-gray-900">
              {{
                getSourceAttentionItem(sourceCollectionResult.sourceName)?.recommendedAction.label
              }}
            </div>
            <div class="mt-1 text-xs text-gray-600">
              {{
                getSourceAttentionItem(sourceCollectionResult.sourceName)?.recommendedAction
                  .description
              }}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <router-link
                :to="buildCrawlerSourceLink(sourceCollectionResult.sourceName, 'attention')"
                :class="getSourceActionClass(sourceCollectionResult.sourceName, 'crawler')"
              >
                {{ getSourceActionLabel(sourceCollectionResult.sourceName, 'crawler', '来源策略') }}
              </router-link>
              <router-link
                :to="buildAdminPlaySourcesLink(sourceCollectionResult.sourceName, 'attention')"
                :class="getSourceActionClass(sourceCollectionResult.sourceName, 'play-sources')"
              >
                {{
                  getSourceActionLabel(
                    sourceCollectionResult.sourceName,
                    'play-sources',
                    '播放源排障',
                  )
                }}
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-gray-500">暂无可用的爬虫目标</p>
        </div>
      </div>

      <!-- 快速爬取 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">快速爬取</h2>

        <form class="space-y-4" @submit.prevent="quickCrawl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择爬虫目标 *</label>
            <select
              v-model="quickCrawlForm.targetName"
              required
              class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">请选择爬虫目标</option>
              <option v-for="target in crawlerTargets" :key="target.name" :value="target.name">
                {{ target.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">资源URL *</label>
            <input
              v-model="quickCrawlForm.url"
              type="url"
              required
              placeholder="请输入要爬取的资源URL"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="flex items-center">
            <input
              v-model="quickCrawlForm.saveToDatabase"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900"> 爬取后自动保存到数据库 </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="quickCrawling"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ quickCrawling ? '爬取中...' : '开始爬取' }}
            </button>
          </div>
        </form>
      </div>

      <!-- 爬取结果展示 -->
      <div v-if="crawlResult" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">爬取结果</h2>

        <div v-if="crawlResult.success" class="space-y-4">
          <div class="p-4 bg-green-50 rounded-lg">
            <h3 class="font-medium text-green-800">爬取成功！</h3>
            <p class="text-green-700 mt-1">{{ crawlResult.message }}</p>
          </div>

          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">爬取数据</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span class="font-medium">标题:</span> {{ crawlResult.data.title }}</p>
                <p><span class="font-medium">类型:</span> {{ crawlResult.data.type }}</p>
                <p><span class="font-medium">评分:</span> {{ crawlResult.data.rating }}</p>
                <p>
                  <span class="font-medium">导演:</span> {{ crawlResult.data.director || '无' }}
                </p>
                <p><span class="font-medium">主演:</span> {{ crawlResult.data.actors || '无' }}</p>
              </div>
              <div>
                <p><span class="font-medium">来源:</span> {{ crawlResult.data.source }}</p>
                <p>
                  <span class="font-medium">上映日期:</span>
                  {{ crawlResult.data.releaseDate || '无' }}
                </p>
                <p>
                  <span class="font-medium">剧集数:</span>
                  {{ crawlResult.data.episodeCount || '无' }}
                </p>
                <p v-if="crawlResult.data.poster">
                  <span class="font-medium">海报:</span> {{ crawlResult.data.poster }}
                </p>
              </div>
            </div>

            <div v-if="crawlResult.data.description" class="mt-3">
              <p class="font-medium">简介:</p>
              <p class="text-gray-700 mt-1">{{ crawlResult.data.description }}</p>
            </div>

            <div
              v-if="getCrawlExtractionSummary()"
              class="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-800"
            >
              <div class="font-medium">提取摘要</div>
              <div class="mt-1 text-xs text-blue-700">
                可播链接 {{ getCrawlExtractionSummary()?.playableUrlCount || 0 }} · 字段命中
                {{ getCrawlExtractionSummary()?.extractedFieldCount || 0 }} · 背景图
                {{ getCrawlExtractionSummary()?.hasBackdrop ? '已提取' : '缺失' }} · 时长
                {{ getCrawlExtractionSummary()?.hasDuration ? '已提取' : '缺失' }}
              </div>
            </div>

            <div v-if="crawlResult.data.genres && crawlResult.data.genres.length > 0" class="mt-3">
              <p class="font-medium">类型标签:</p>
              <div class="flex flex-wrap gap-2 mt-1">
                <span
                  v-for="genre in crawlResult.data.genres"
                  :key="genre"
                  class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="quickCrawlForm.saveToDatabase && crawlResult.persistence"
            class="p-4 bg-blue-50 rounded-lg"
          >
            <p class="text-blue-800">
              数据已自动保存到数据库，媒体ID: {{ crawlResult.persistence.mediaResourceId }}
            </p>
            <p class="mt-1 text-sm text-blue-700">
              {{
                crawlResult.persistence.created ? '新建媒体资源' : '复用已有媒体资源'
              }}；新增播放源 {{ crawlResult.persistence.playSourceCount }} 个，跳过重复
              {{ crawlResult.persistence.skippedPlaySources }} 个
            </p>
            <div
              v-if="crawlResult.data?.source && getSourceAttentionItem(crawlResult.data.source)"
              class="mt-3 rounded-lg border border-blue-200 bg-white p-4"
            >
              <div class="text-xs text-blue-600">建议动作</div>
              <div class="mt-2 text-sm font-medium text-gray-900">
                {{ getSourceAttentionItem(crawlResult.data.source)?.recommendedAction.label }}
              </div>
              <div class="mt-1 text-xs text-gray-600">
                {{ getSourceAttentionItem(crawlResult.data.source)?.recommendedAction.description }}
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <router-link
                  :to="buildCrawlerSourceLink(crawlResult.data.source, 'attention')"
                  :class="getSourceActionClass(crawlResult.data.source, 'crawler')"
                >
                  {{ getSourceActionLabel(crawlResult.data.source, 'crawler', '来源策略') }}
                </router-link>
                <router-link
                  :to="buildAdminPlaySourcesLink(crawlResult.data.source, 'attention')"
                  :class="getSourceActionClass(crawlResult.data.source, 'play-sources')"
                >
                  {{ getSourceActionLabel(crawlResult.data.source, 'play-sources', '播放源排障') }}
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="p-4 bg-red-50 rounded-lg">
          <h3 class="font-medium text-red-800">爬取失败</h3>
          <p class="text-red-700 mt-1">{{ crawlResult.message }}</p>
        </div>

        <div class="mt-4">
          <button
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @click="clearCrawlResult"
          >
            清除结果
          </button>
        </div>
      </div>

      <!-- 批量爬取 -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">批量爬取</h2>

        <form class="space-y-4" @submit.prevent="batchCrawl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择爬虫目标 *</label>
            <select
              v-model="batchCrawlForm.targetName"
              required
              class="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">请选择爬虫目标</option>
              <option v-for="target in crawlerTargets" :key="target.name" :value="target.name">
                {{ target.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL列表 *</label>
            <textarea
              v-model="batchCrawlForm.urls"
              rows="5"
              required
              placeholder="请输入要爬取的URL列表，每行一个URL"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div class="flex items-center">
            <input
              v-model="batchCrawlForm.saveToDatabase"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-900"> 爬取后自动保存到数据库 </label>
          </div>

          <div>
            <button
              type="submit"
              :disabled="batchCrawling"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {{ batchCrawling ? '批量爬取中...' : '开始批量爬取' }}
            </button>
          </div>
        </form>

        <!-- 批量爬取结果 -->
        <div v-if="batchCrawlResult" class="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-medium text-gray-900 mb-2">批量爬取结果</h3>
          <div v-if="batchCrawlResult.data" class="text-sm">
            <p>成功: {{ batchCrawlResult.data.successCount }}</p>
            <p>失败: {{ batchCrawlResult.data.failureCount }}</p>
            <p>总计: {{ batchCrawlResult.data.totalRequested }}</p>
          </div>

          <div v-if="batchCrawlResult.data && batchCrawlResult.data.crawledData" class="mt-3">
            <h4 class="font-medium text-gray-900 mb-2">成功爬取的数据:</h4>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div
                v-for="(data, index) in batchCrawlResult.data.crawledData"
                :key="index"
                class="p-3 bg-white border border-gray-200 rounded"
              >
                <p class="font-medium">{{ data.title }}</p>
                <p class="text-gray-600 text-sm">
                  评分: {{ data.rating }} | 来源: {{ data.source }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <div
              v-if="batchCrawlResult.success && batchCrawlResult.data"
              class="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800"
            >
              已成功保存 {{ batchCrawlResult.data.savedCount }} 条资源，共请求
              {{ batchCrawlResult.data.totalRequested }} 个 URL。
            </div>
            <button
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @click="clearBatchCrawlResult"
            >
              清除结果
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import {
    crawlerApi,
    type BatchCrawlResponse,
    type CollectionSourceStatistics,
    type CollectionStatistics,
    type CollectedSourceSummary,
    type CrawlerTarget,
    type CrawlResultResponse,
    type SourcePolicyUpdatePayload,
    type SourceHealthSummary,
  } from '@/api/crawler';
  import { schedulerApi, type DailySourceCollectionRunSummary } from '@/api/scheduler';
  import {
    buildAttentionSourceItem,
    getAlertFilterRecommendedAction,
    matchesCrawlerAlertFilter,
    type AlertActionTarget,
    type AttentionSourceItem,
    type CrawlerAlertFilter,
  } from '@/utils/collection-source-alerts';

  const route = useRoute();
  const router = useRouter();

  // 状态管理
  const crawlerTargets = ref<CrawlerTarget[]>([]);
  const targetsLoading = ref(false);
  const refreshing = ref(false);
  const testingTarget = ref('');
  const collectingSource = ref('');
  const quickCrawling = ref(false);
  const batchCrawling = ref(false);
  const dailyRunning = ref(false);
  const savingPolicyFor = ref('');

  // 爬取结果
  const crawlResult = ref<CrawlResultResponse | null>(null);
  const batchCrawlResult = ref<BatchCrawlResponse | null>(null);
  const dailySummary = ref<DailySourceCollectionRunSummary | null>(null);
  const collectionStatistics = ref<CollectionStatistics | null>(null);
  const sourceCollectionResult = ref<CollectedSourceSummary | null>(null);
  const sourceHealthSummaries = ref<SourceHealthSummary[]>([]);
  const policyDrafts = ref<Record<string, SourcePolicyUpdatePayload>>({});
  const focusedSourceName = ref('');
  const sourceCardRefs = ref<Record<string, HTMLElement | null>>({});

  // 表单数据
  const quickCrawlForm = ref({
    targetName: '',
    url: '',
    saveToDatabase: true,
  });

  const batchCrawlForm = ref({
    targetName: '',
    urls: '',
    saveToDatabase: true,
  });

  // 加载爬虫目标
  const loadCrawlerTargets = async () => {
    targetsLoading.value = true;

    try {
      const targets = await crawlerApi.getTargets();
      crawlerTargets.value = targets.map(target => ({
        ...target,
        status: 'unknown', // 默认状态
      }));
    } catch (error) {
      console.error('加载爬虫目标失败:', error);
      crawlerTargets.value = [];
    } finally {
      targetsLoading.value = false;
    }
  };

  const loadDailySummary = async () => {
    try {
      dailySummary.value = await schedulerApi.getDailySourceCollectionSummary();
    } catch (error) {
      console.error('加载每日采集摘要失败:', error);
    }
  };

  const loadCollectionStatistics = async () => {
    try {
      const response = await crawlerApi.getStatistics();
      collectionStatistics.value = response.data || null;
    } catch (error) {
      console.error('加载采集概览失败:', error);
      collectionStatistics.value = null;
    }
  };

  const loadSourceHealth = async () => {
    try {
      sourceHealthSummaries.value = await crawlerApi.getSourceHealth();
      sourceHealthSummaries.value.forEach(item => {
        policyDrafts.value[item.name] = {
          dailyEnabled: item.dailyEnabled,
          dailyLimit: item.dailyLimit,
          proxyMode: item.proxyMode,
          proxyForDiscovery: item.proxyForDiscovery,
          proxyForDetail: item.proxyForDetail,
          proxyForConnectivityCheck: item.proxyForConnectivityCheck,
          requirePlayableUrls: item.requirePlayableUrls,
          minimumPlayableUrls: item.minimumPlayableUrls,
        };
      });
    } catch (error) {
      console.error('加载来源健康摘要失败:', error);
    }
  };

  const sourceHealthMap = computed(() => {
    return new Map(sourceHealthSummaries.value.map(item => [item.name, item]));
  });

  const collectionSourceStatsMap = computed(() => {
    return new Map((collectionStatistics.value?.sources || []).map(item => [item.name, item]));
  });
  const sourceAttentionMap = computed(() => {
    return new Map<string, AttentionSourceItem>(
      (collectionStatistics.value?.sources || [])
        .map(source => buildAttentionSourceItem(source))
        .filter((item): item is AttentionSourceItem => item !== null)
        .map(item => [item.source.name, item]),
    );
  });
  const activeAlertFilter = computed<CrawlerAlertFilter | ''>(() => {
    const value = typeof route.query.alertFilter === 'string' ? route.query.alertFilter : '';

    return value === 'critical' || value === 'high' || value === 'stalled' || value === 'inactive'
      ? value
      : '';
  });
  const filteredCrawlerTargets = computed(() => {
    const alertFilter = activeAlertFilter.value;

    if (focusedSourceName.value || !alertFilter || !collectionStatistics.value) {
      return crawlerTargets.value;
    }

    return crawlerTargets.value.filter(target => {
      const sourceStats = collectionSourceStatsMap.value.get(target.name);
      return sourceStats ? matchesCrawlerAlertFilter(sourceStats, alertFilter) : false;
    });
  });

  const getSourceHealth = (targetName: string) => {
    return sourceHealthMap.value.get(targetName);
  };

  const getCollectionSourceStats = (targetName: string) => {
    return collectionSourceStatsMap.value.get(targetName) || null;
  };

  const getSourceAttentionItem = (targetName: string) => {
    return sourceAttentionMap.value.get(targetName) || null;
  };

  const getSourceCardId = (targetName: string) => {
    return `crawler-source-${encodeURIComponent(targetName)}`;
  };

  const setSourceCardRef = (targetName: string, element: unknown) => {
    const rawElement =
      element && typeof element === 'object' && '$el' in element
        ? (element as { $el?: unknown }).$el
        : element;

    sourceCardRefs.value[targetName] = rawElement instanceof HTMLElement ? rawElement : null;
  };

  const isFocusedSource = (targetName: string) => {
    return focusedSourceName.value === targetName;
  };

  const getSourceCardClass = (targetName: string) => {
    return [
      'rounded-2xl border p-4 transition-all duration-300',
      isFocusedSource(targetName)
        ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-rose-50 shadow-lg ring-2 ring-amber-200'
        : 'border-gray-200 bg-white hover:shadow-md',
    ];
  };

  const focusedSourceStats = computed<CollectionSourceStatistics | null>(() => {
    if (!focusedSourceName.value) {
      return null;
    }

    return getCollectionSourceStats(focusedSourceName.value);
  });

  const getFocusOriginLabel = () => {
    return route.query.focus === 'attention' ? '待关注来源' : '重点来源';
  };

  const getAlertFilterLabel = () => {
    const labelMap: Record<CrawlerAlertFilter, string> = {
      critical: '立即止损来源',
      high: '优先处理来源',
      stalled: '入库停滞来源',
      inactive: '无活跃源来源',
    };

    return activeAlertFilter.value ? labelMap[activeAlertFilter.value] : '来源过滤';
  };

  const getAlertFilterRecommendation = () => {
    return activeAlertFilter.value
      ? getAlertFilterRecommendedAction(activeAlertFilter.value)
      : null;
  };

  const getAlertActionClass = (target: AlertActionTarget) => {
    const recommendedTarget = getAlertFilterRecommendation()?.target;

    return [
      'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition',
      recommendedTarget === target
        ? 'border border-rose-300/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
    ];
  };

  const getAlertActionLabel = (target: AlertActionTarget, fallbackLabel: string) => {
    return getAlertFilterRecommendation()?.target === target
      ? `建议 · ${fallbackLabel}`
      : fallbackLabel;
  };

  const getSourceActionClass = (targetName: string, target: AlertActionTarget) => {
    const recommendedTarget = getSourceAttentionItem(targetName)?.recommendedAction.target;

    return [
      'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition',
      recommendedTarget === target
        ? 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
    ];
  };

  const getSourceActionLabel = (
    targetName: string,
    target: AlertActionTarget,
    fallbackLabel: string,
  ) => {
    return getSourceAttentionItem(targetName)?.recommendedAction.target === target
      ? `建议 · ${fallbackLabel}`
      : fallbackLabel;
  };

  const applyRouteSourceFocus = async () => {
    const sourceName = typeof route.query.source === 'string' ? route.query.source.trim() : '';
    if (!sourceName) {
      focusedSourceName.value = '';
      return;
    }

    const matchedTarget = crawlerTargets.value.find(target => target.name === sourceName);
    if (!matchedTarget) {
      focusedSourceName.value = '';
      return;
    }

    focusedSourceName.value = matchedTarget.name;
    quickCrawlForm.value.targetName = matchedTarget.name;

    await nextTick();
    const sourceCardElement = sourceCardRefs.value[matchedTarget.name];
    sourceCardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const clearFocusedSource = async () => {
    focusedSourceName.value = '';

    const nextQuery = { ...route.query };
    delete nextQuery.source;
    delete nextQuery.focus;

    await router.replace({ query: nextQuery });
  };

  const clearAlertFilter = async () => {
    const nextQuery = { ...route.query };
    delete nextQuery.alertFilter;

    await router.replace({ query: nextQuery });
  };

  const buildAdminPlaySourcesLink = (sourceName: string, focus: 'top' | 'attention' = 'top') => {
    return {
      name: 'admin-play-sources',
      query: {
        source: sourceName,
        focus,
      },
    };
  };

  const buildCrawlerSourceLink = (sourceName: string, focus: 'top' | 'attention' = 'top') => {
    return {
      name: 'crawler',
      query: {
        source: sourceName,
        focus,
      },
    };
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return '暂无';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '暂无';
    }

    return parsed.toLocaleString('zh-CN');
  };

  const getPolicyDraft = (targetName: string) => {
    return (
      policyDrafts.value[targetName] || {
        dailyEnabled: true,
        dailyLimit: 8,
        proxyMode: 'direct',
        proxyForDiscovery: false,
        proxyForDetail: false,
        proxyForConnectivityCheck: false,
        requirePlayableUrls: true,
        minimumPlayableUrls: 1,
      }
    );
  };

  const formatProxyTargets = (
    item?: {
      proxyForDiscovery?: boolean;
      proxyForDetail?: boolean;
      proxyForConnectivityCheck?: boolean;
    } | null,
  ) => {
    if (!item) {
      return '默认直连';
    }

    const targets = [
      item.proxyForDiscovery ? '列表' : '',
      item.proxyForDetail ? '详情' : '',
      item.proxyForConnectivityCheck ? '检测' : '',
    ].filter(Boolean);

    return targets.length > 0 ? targets.join(' / ') : '默认直连';
  };

  const formatQualityBreakdown = (
    breakdown?: {
      availability: number;
      freshness: number;
      extraction: number;
      inventory: number;
      validation: number;
    } | null,
  ) => {
    if (!breakdown) {
      return '暂无';
    }

    return [
      `可用 ${breakdown.availability}`,
      `新鲜 ${breakdown.freshness}`,
      `提取 ${breakdown.extraction}`,
      `库存 ${breakdown.inventory}`,
      `校验 ${breakdown.validation}`,
    ].join(' / ');
  };

  const saveSourcePolicy = async (targetName: string) => {
    try {
      savingPolicyFor.value = targetName;
      await crawlerApi.updateSourcePolicy(targetName, getPolicyDraft(targetName));
      await loadSourceHealth();
    } catch (error) {
      console.error('保存来源策略失败:', error);
    } finally {
      savingPolicyFor.value = '';
    }
  };

  // 刷新爬虫目标
  const refreshTargets = async () => {
    refreshing.value = true;
    await loadCrawlerTargets();
    await loadDailySummary();
    await loadCollectionStatistics();
    await loadSourceHealth();
    await applyRouteSourceFocus();
    refreshing.value = false;
  };

  const collectPopularFromSource = async (targetName: string) => {
    try {
      collectingSource.value = targetName;
      const response = await crawlerApi.collectPopularResources(targetName, 8);
      sourceCollectionResult.value = response.data || null;
      await loadCollectionStatistics();
      await loadSourceHealth();
      await loadDailySummary();
    } catch (error) {
      console.error('按来源采集失败:', error);
    } finally {
      collectingSource.value = '';
    }
  };

  const runDailyCollection = async () => {
    try {
      dailyRunning.value = true;
      dailySummary.value = await schedulerApi.runDailySourceCollection();
      await loadCollectionStatistics();
      await loadSourceHealth();
    } catch (error) {
      console.error('手动触发每日采集失败:', error);
    } finally {
      dailyRunning.value = false;
    }
  };

  // 测试连接
  const testConnection = async (targetName: string) => {
    try {
      testingTarget.value = targetName;
      const response = await crawlerApi.testConnection(targetName);

      // 更新目标状态
      const targetIndex = crawlerTargets.value.findIndex(t => t.name === targetName);
      if (targetIndex !== -1) {
        crawlerTargets.value[targetIndex].status = response.success ? 'online' : 'offline';
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      // 更新目标状态为离线
      const targetIndex = crawlerTargets.value.findIndex(t => t.name === targetName);
      if (targetIndex !== -1) {
        crawlerTargets.value[targetIndex].status = 'offline';
      }
    } finally {
      testingTarget.value = '';
    }
  };

  // 从目标快速填充到表单
  const crawlFromTarget = (targetName: string) => {
    quickCrawlForm.value.targetName = targetName;
  };

  // 快速爬取
  const quickCrawl = async () => {
    try {
      quickCrawling.value = true;

      const response = quickCrawlForm.value.saveToDatabase
        ? await crawlerApi.crawlAndSave({
            url: quickCrawlForm.value.url,
            targetName: quickCrawlForm.value.targetName,
          })
        : await crawlerApi.crawl({
            url: quickCrawlForm.value.url,
            targetName: quickCrawlForm.value.targetName,
          });

      crawlResult.value = response;
    } catch (error: unknown) {
      console.error('快速爬取失败:', error);
      crawlResult.value = {
        success: false,
        message: error instanceof Error ? error.message : '爬取失败',
      };
    } finally {
      quickCrawling.value = false;
    }
  };

  // 批量爬取
  const batchCrawl = async () => {
    try {
      batchCrawling.value = true;

      // 解析URL列表
      const urls = batchCrawlForm.value.urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const response = await crawlerApi.batchCrawl({
        targetName: batchCrawlForm.value.targetName,
        urls,
      });

      batchCrawlResult.value = response;
    } catch (error: unknown) {
      console.error('批量爬取失败:', error);
      batchCrawlResult.value = {
        success: false,
        message: error instanceof Error ? error.message : '批量爬取失败',
      };
    } finally {
      batchCrawling.value = false;
    }
  };

  // 清除爬取结果

  const getCrawlExtractionSummary = () => {
    const metadata = crawlResult.value?.data?.metadata as
      | { extractionSummary?: Record<string, unknown> }
      | undefined;
    return metadata?.extractionSummary;
  };
  const clearCrawlResult = () => {
    crawlResult.value = null;
  };

  // 清除批量爬取结果
  const clearBatchCrawlResult = () => {
    batchCrawlResult.value = null;
  };

  // 组件挂载时加载数据
  onMounted(() => {
    void loadCrawlerTargets();
    void loadDailySummary();
    void loadCollectionStatistics();
    void loadSourceHealth();
  });

  watch(
    () => route.query.source,
    () => {
      void applyRouteSourceFocus();
    },
  );

  watch(
    crawlerTargets,
    () => {
      void applyRouteSourceFocus();
    },
    { deep: false },
  );
</script>
