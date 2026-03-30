<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">播放源管理</h1>
        <p class="mt-2 text-gray-600">按来源排查播放源状态、优先级和关联媒体</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          @click="refreshPlaySources"
        >
          刷新列表
        </button>
      </div>
    </div>

    <div
      v-if="focusedSourceName"
      class="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 shadow-lg ring-1 ring-slate-800"
    >
      <div class="flex flex-col gap-4 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
            后台首页 · {{ focusOriginLabel }}
          </div>
          <h2 class="mt-3 text-xl font-semibold">当前排障来源：{{ focusedSourceName }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            当前列表已按来源筛选，适合快速查看该来源的播放源状态、最近校验结果和关联媒体，便于影视聚合站做稳定源排障。
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <router-link
            :to="buildCrawlerLink()"
            class="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20"
          >
            回到来源策略
          </router-link>
          <button
            class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            @click="clearSourceFilter"
          >
            查看全部播放源
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="activeAlertFilter"
      class="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950 shadow-lg ring-1 ring-slate-800"
    >
      <div class="flex flex-col gap-4 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-rose-100">
            后台首页 · 告警汇总
          </div>
          <h2 class="mt-3 text-xl font-semibold">当前告警视图：{{ alertFilterLabel }}</h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            已根据首页告警小卡筛出匹配来源的播放源列表，适合快速处理异常源、入库停滞源或失去活跃播放能力的来源。
          </p>
          <p class="mt-2 text-xs text-slate-400">
            当前命中 {{ alertFilteredSourceNames.length }} 个来源。
          </p>
          <p v-if="alertFilterRecommendation" class="mt-2 text-xs text-rose-100/90">
            {{ alertFilterRecommendation.label }} · {{ alertFilterRecommendation.description }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <router-link
            :to="{ name: 'admin-dashboard', hash: '#dashboard-alert-summary' }"
            class="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            回到首页告警区
          </router-link>
          <router-link
            :to="{ name: 'crawler', query: { alertFilter: activeAlertFilter } }"
            :class="getAlertActionClass('crawler')"
          >
            {{ getAlertActionLabel('crawler', '来源视图') }}
          </router-link>
          <router-link
            :to="{ name: 'admin-play-sources', query: { alertFilter: activeAlertFilter } }"
            :class="getAlertActionClass('play-sources')"
          >
            {{ getAlertActionLabel('play-sources', '当前播放源视图') }}
          </router-link>
          <button
            class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            @click="resetFilters"
          >
            查看全部播放源
          </button>
        </div>
      </div>

      <div
        v-if="alertFilteredSourceNames.length > 0"
        class="border-t border-white/10 px-6 py-4 text-sm text-slate-300"
      >
        <details class="group">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-white">
            <span>查看当前命中来源列表（{{ alertFilteredSourceNames.length }}）</span>
            <span class="text-xs text-slate-400 transition group-open:rotate-180">⌄</span>
          </summary>
          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="sourceName in alertFilteredSourceNames"
              :key="sourceName"
              class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
            >
              {{ sourceName }}
            </span>
          </div>
        </details>
      </div>
    </div>

    <div
      v-if="focusedSourceName"
      class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
    >
      <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-lg ring-1 ring-slate-800">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-medium">来源健康摘要</h3>
            <p class="mt-1 text-sm text-slate-300">把质量分、可用率、最近入库和最近校验集中到同一页</p>
          </div>
          <span class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
            {{ sourceHealthTone }}
          </span>
        </div>

        <div v-if="sourceContextLoading" class="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          正在加载来源健康摘要...
        </div>

        <div
          v-else-if="focusedSourceHealth || focusedSourceCollectionStats"
          class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="text-xs text-slate-400">质量分</div>
            <div class="mt-2 text-2xl font-semibold text-white">
              {{ focusedSourceHealth?.qualityScore ?? focusedSourceCollectionStats?.qualityScore ?? 0 }}
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="text-xs text-slate-400">可用率</div>
            <div class="mt-2 text-2xl font-semibold text-white">
              {{ focusedSourceHealth?.activeRate ?? focusedSourceCollectionStats?.activeRate ?? 0 }}%
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="text-xs text-slate-400">已入库媒体</div>
            <div class="mt-2 text-2xl font-semibold text-white">
              {{ focusedSourceCollectionStats?.totalCrawled ?? 0 }}
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="text-xs text-slate-400">活跃源 / 总源</div>
            <div class="mt-2 text-2xl font-semibold text-white">
              {{ focusedSourceHealth?.activePlaySources ?? focusedSourceCollectionStats?.activePlaySources ?? 0 }}
              / {{ focusedSourceHealth?.totalPlaySources ?? focusedSourceCollectionStats?.totalPlaySources ?? 0 }}
            </div>
          </div>
        </div>

        <div
          v-if="!sourceContextLoading && (focusedSourceHealth || focusedSourceCollectionStats)"
          class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2"
        >
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div class="text-xs text-slate-400">最近入库</div>
            <div class="mt-2">{{ formatDate(focusedSourceCollectionStats?.lastCrawled) }}</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div class="text-xs text-slate-400">最近校验</div>
            <div class="mt-2">
              {{ formatDate(focusedSourceHealth?.latestCheckedAt || focusedSourceCollectionStats?.lastCheckedAt) }}
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div class="text-xs text-slate-400">代理策略</div>
            <div class="mt-2">
              当前 {{ focusedSourceHealth?.proxyMode || focusedSourceCollectionStats?.proxyMode || 'direct' }}
              <span v-if="focusedSourceHealth?.suggestedProxyMode" class="text-slate-400">
                · 建议 {{ focusedSourceHealth.suggestedProxyMode }}
              </span>
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div class="text-xs text-slate-400">近24h新增源</div>
            <div class="mt-2">{{ focusedSourceHealth?.recentPlaySources24h ?? focusedSourceCollectionStats?.recentPlaySources24h ?? 0 }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="text-base font-medium text-gray-900">运维建议</h3>
        <p class="mt-1 text-sm text-gray-500">结合当前来源健康状态给出处理建议</p>

        <div v-if="sourceContextLoading" class="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          正在生成来源建议...
        </div>

        <div v-else-if="focusedSourceHealth || focusedSourceCollectionStats" class="mt-4 space-y-3">
          <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {{ focusedSourceHealth?.recommendation || defaultSourceRecommendation }}
          </div>

          <div
            v-if="focusedSourceAttentionItem"
            class="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-900"
          >
            <div class="text-xs text-amber-700">建议动作</div>
            <div class="mt-2 font-medium text-gray-900">
              {{ focusedSourceAttentionItem.recommendedAction.label }}
            </div>
            <div class="mt-1 text-[13px] text-gray-600">
              {{ focusedSourceAttentionItem.recommendedAction.description }}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <router-link
                :to="buildCrawlerLink()"
                :class="getFocusedSourceActionClass('crawler')"
              >
                {{ getFocusedSourceActionLabel('crawler', '来源策略') }}
              </router-link>
              <router-link
                :to="{ name: 'admin-play-sources', query: { source: focusedSourceName, focus: route.query.focus || 'top' } }"
                :class="getFocusedSourceActionClass('play-sources')"
              >
                {{ getFocusedSourceActionLabel('play-sources', '当前播放源视图') }}
              </router-link>
            </div>
          </div>

          <div class="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-800">
            <div class="font-medium">排障建议</div>
            <ul class="mt-2 space-y-1 text-[13px]">
              <li>- 优先查看 `error` 与 `checking` 状态的播放源是否集中在同一批链接。</li>
              <li>- 若可用率偏低但质量分尚可，优先检查代理模式与最近校验时间。</li>
              <li>- 若最近入库为空，优先返回来源策略页排查采集链路是否停滞。</li>
            </ul>
          </div>
        </div>

        <div v-else class="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          {{ sourceContextError || '当前来源尚未生成可展示的健康摘要。' }}
        </div>
      </div>
    </div>

    <form
      class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      @submit.prevent="applyFilters"
    >
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_160px_180px_220px_auto]">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">来源筛选</span>
          <input
            v-model.trim="source"
            type="text"
            placeholder="如：豆瓣电影、量子源"
            class="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">搜索关键词</span>
          <input
            v-model.trim="search"
            type="text"
            placeholder="搜索媒体标题、链接、来源名"
            class="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">类型</span>
          <select
            v-model="type"
            class="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            @change="applyFilters"
          >
            <option value="">全部类型</option>
            <option value="online">online</option>
            <option value="stream">stream</option>
            <option value="download">download</option>
            <option value="parser">parser</option>
            <option value="iptv">iptv</option>
            <option value="magnet">magnet</option>
          </select>
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">状态</span>
          <select
            v-model="status"
            class="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            @change="applyFilters"
          >
            <option value="">全部状态</option>
            <option value="active">active</option>
            <option value="checking">checking</option>
            <option value="error">error</option>
            <option value="inactive">inactive</option>
          </select>
        </label>

        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-gray-700">排序</span>
          <select
            v-model="sortKey"
            class="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            @change="applyFilters"
          >
            <option value="lastCheckedAt:ASC">最久未校验优先</option>
            <option value="lastCheckedAt:DESC">最近已校验优先</option>
            <option value="createdAt:DESC">最新创建优先</option>
            <option value="priority:ASC">高优先级优先</option>
          </select>
        </label>

        <div class="flex flex-wrap items-end gap-2">
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            应用筛选
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            @click="resetFilters"
          >
            重置
          </button>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span class="rounded-full bg-gray-100 px-2.5 py-1">筛选已生效</span>
        <span
          v-if="focusedSourceName"
          class="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"
        >
          来源：{{ focusedSourceName }}
        </span>
        <span
          v-if="appliedSearch"
          class="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700"
        >
          搜索：{{ appliedSearch }}
        </span>
        <span v-if="appliedType" class="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
          类型：{{ appliedType }}
        </span>
        <span v-if="appliedStatus" class="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
          状态：{{ appliedStatus }}
        </span>
        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          排序：{{ sortLabel }}
        </span>
      </div>
    </form>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
      <div class="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 p-5 text-white shadow-lg ring-1 ring-slate-800">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-medium">快捷切换</h3>
            <p class="mt-1 text-sm text-slate-300">一键切到异常源、检查中或久未校验来源</p>
          </div>
          <span class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
            当前：{{ activeQuickFilterLabel }}
          </span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="option in quickFilterOptions"
            :key="option.key"
            type="button"
            :class="getQuickFilterClass(option.key)"
            @click="applyQuickFilter(option.key)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div class="text-xs text-gray-500">当前页条目</div>
          <div class="mt-2 text-2xl font-semibold text-gray-900">{{ currentPageStats.total }}</div>
          <div class="mt-1 text-xs text-gray-400">当前筛选结果</div>
        </div>
        <div class="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 shadow-sm">
          <div class="text-xs text-rose-500">异常源</div>
          <div class="mt-2 text-2xl font-semibold text-rose-700">{{ currentPageStats.error }}</div>
          <div class="mt-1 text-xs text-rose-400">状态为 error</div>
        </div>
        <div class="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 shadow-sm">
          <div class="text-xs text-amber-600">待校验 / 检查中</div>
          <div class="mt-2 text-2xl font-semibold text-amber-700">
            {{ currentPageStats.needsAttention }}
          </div>
          <div class="mt-1 text-xs text-amber-500">checking 或尚无校验时间</div>
        </div>
        <div class="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
          <div class="text-xs text-emerald-600">近24h已校验</div>
          <div class="mt-2 text-2xl font-semibold text-emerald-700">
            {{ currentPageStats.checkedRecently }}
          </div>
          <div class="mt-1 text-xs text-emerald-500">适合判断近期稳定性</div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div v-if="loading" class="p-8 text-center text-gray-500">加载中...</div>
      <div v-else-if="error" class="p-8 text-center text-red-600">{{ error }}</div>
      <template v-else>
        <div v-if="playSources.length === 0" class="p-10 text-center">
          <div class="mx-auto max-w-md">
            <h3 class="text-base font-semibold text-gray-900">未找到匹配的播放源</h3>
            <p class="mt-2 text-sm leading-6 text-gray-500">
              可以尝试放宽来源或搜索关键词，或者返回爬虫页继续检查采集策略和来源可用性。
            </p>
            <p
              v-if="focusedSourceAttentionItem"
              class="mt-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-left text-sm text-amber-900"
            >
              <span class="block text-xs text-amber-700">建议动作</span>
              <span class="mt-1 block font-medium text-gray-900">
                {{ focusedSourceAttentionItem.recommendedAction.label }}
              </span>
              <span class="mt-1 block text-[13px] text-gray-600">
                {{ focusedSourceAttentionItem.recommendedAction.description }}
              </span>
            </p>
            <p
              v-else-if="alertFilterRecommendation"
              class="mt-3 rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-left text-sm text-rose-900"
            >
              <span class="block text-xs text-rose-700">告警建议</span>
              <span class="mt-1 block font-medium text-gray-900">
                {{ alertFilterRecommendation.label }}
              </span>
              <span class="mt-1 block text-[13px] text-gray-600">
                {{ alertFilterRecommendation.description }}
              </span>
            </p>
            <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                class="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                @click="resetFilters"
              >
                清空筛选
              </button>
              <router-link
                v-if="focusedSourceName"
                :to="buildCrawlerLink()"
                :class="getFocusedSourceActionClass('crawler')"
              >
                {{ getFocusedSourceActionLabel('crawler', '查看来源策略') }}
              </router-link>
              <router-link
                v-if="focusedSourceAttentionItem"
                :to="{ name: 'admin-play-sources', query: { source: focusedSourceName, focus: route.query.focus || 'top' } }"
                :class="getFocusedSourceActionClass('play-sources')"
              >
                {{ getFocusedSourceActionLabel('play-sources', '保持播放源视图') }}
              </router-link>
              <router-link
                v-else-if="alertFilterRecommendation"
                :to="{ name: 'crawler', query: { alertFilter: activeAlertFilter } }"
                :class="getAlertActionClass('crawler')"
              >
                {{ getAlertActionLabel('crawler', '来源视图') }}
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  来源
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  媒体
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  类型
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  状态
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  优先级
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  最后校验
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  创建时间
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="item in playSources"
                :key="item.id"
                :class="getPlaySourceRowClass(item)"
              >
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="font-medium">
                    {{ item.sourceName || item.name || '未命名播放源' }}
                  </div>
                  <div class="line-clamp-1 text-xs text-gray-500">{{ item.url }}</div>
                  <div v-if="getValidationSummary(item)" class="mt-1 line-clamp-2 text-xs text-gray-400">
                    {{ getValidationSummary(item) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  <div>{{ item.mediaResource?.title || `#${item.mediaResourceId}` }}</div>
                  <div v-if="item.mediaResource?.source" class="text-xs text-gray-400">
                    资源来源：{{ item.mediaResource.source }}
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.type }}</td>
                <td class="px-4 py-3 text-sm">
                  <span :class="getStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.priority }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.lastCheckedAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between"
        >
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3 self-end md:self-auto">
            <button
              :disabled="page <= 1"
              class="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-50"
              @click="changePage(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-50"
              @click="changePage(page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { adminApi } from '@/api/admin';
  import {
    crawlerApi,
    type CollectionSourceStatistics,
    type SourceHealthSummary,
  } from '@/api/crawler';
  import {
    buildAttentionSourceItem,
    getAlertFilterRecommendedAction,
    matchesCrawlerAlertFilter,
    type AlertActionTarget,
    type AttentionSourceItem,
    type CrawlerAlertFilter,
  } from '@/utils/collection-source-alerts';
  import type { PlaySource } from '@/types/media';

  const route = useRoute();
  const router = useRouter();

  const playSources = ref<PlaySource[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const type = ref('');
  const source = ref('');
  const search = ref('');
  const status = ref('');
  const sortKey = ref('lastCheckedAt:ASC');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);
  const focusedSourceHealth = ref<SourceHealthSummary | null>(null);
  const focusedSourceCollectionStats = ref<CollectionSourceStatistics | null>(null);
  const sourceContextLoading = ref(false);
  const sourceContextError = ref('');
  const alertFilteredSourceNames = ref<string[]>([]);

  const appliedType = computed(() => normalizeQueryValue(route.query.type));
  const focusedSourceName = computed(() => normalizeQueryValue(route.query.source));
  const appliedSearch = computed(() => normalizeQueryValue(route.query.search));
  const appliedStatus = computed(() => normalizeQueryValue(route.query.status));
  const activeAlertFilter = computed<CrawlerAlertFilter | ''>(() => {
    const value = normalizeQueryValue(route.query.alertFilter);

    return value === 'critical' || value === 'high' || value === 'stalled' || value === 'inactive'
      ? value
      : '';
  });
  const hasActiveFilters = computed(() =>
    Boolean(
      appliedType.value ||
        focusedSourceName.value ||
        appliedSearch.value ||
        appliedStatus.value ||
        activeAlertFilter.value,
    ),
  );
  const focusOriginLabel = computed(() =>
    route.query.focus === 'attention' ? '待关注来源' : '重点来源',
  );
  const sortLabel = computed(() => {
    const sortLabelMap: Record<string, string> = {
      'lastCheckedAt:ASC': '最久未校验优先',
      'lastCheckedAt:DESC': '最近已校验优先',
      'createdAt:DESC': '最新创建优先',
      'priority:ASC': '高优先级优先',
    };

    return sortLabelMap[sortKey.value] || '最久未校验优先';
  });

  const normalizeQueryValue = (value: unknown) => {
    return typeof value === 'string' ? value.trim() : '';
  };

  const normalizePageValue = (value: unknown) => {
    const pageValue = Number.parseInt(typeof value === 'string' ? value : '', 10);
    return Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  };

  type PlaySourceSortField = 'createdAt' | 'lastCheckedAt' | 'priority';
  type PlaySourceSortOrder = 'ASC' | 'DESC';
  type QuickFilterKey = 'all' | 'error' | 'checking' | 'stale' | 'active';

  const quickFilterOptions: Array<{ key: QuickFilterKey; label: string }> = [
    { key: 'all', label: '全部源' },
    { key: 'error', label: '仅看异常' },
    { key: 'checking', label: '仅看检查中' },
    { key: 'stale', label: '未校验优先' },
    { key: 'active', label: '仅看活跃' },
  ];

  const buildSortKey = (sortBy?: string, sortOrder?: string) => {
    const candidate = `${sortBy || 'lastCheckedAt'}:${sortOrder || 'ASC'}`;
    const allowedSortKeys = new Set([
      'lastCheckedAt:ASC',
      'lastCheckedAt:DESC',
      'createdAt:DESC',
      'priority:ASC',
    ]);

    return allowedSortKeys.has(candidate) ? candidate : 'lastCheckedAt:ASC';
  };

  const parseSortKey = (value: string) => {
    const [sortBy, sortOrder] = value.split(':');
    const resolvedSortBy: PlaySourceSortField =
      sortBy === 'createdAt' || sortBy === 'priority' ? sortBy : 'lastCheckedAt';
    const resolvedSortOrder: PlaySourceSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    return {
      sortBy: resolvedSortBy,
      sortOrder: resolvedSortOrder,
    } as const;
  };

  const getHoursSince = (value?: Date | string | null) => {
    if (!value) {
      return null;
    }

    const parsed = new Date(value).getTime();
    if (Number.isNaN(parsed)) {
      return null;
    }

    return (Date.now() - parsed) / (1000 * 60 * 60);
  };

  const currentPageStats = computed(() => {
    const totalItems = playSources.value.length;
    const errorItems = playSources.value.filter(item => item.status === 'error').length;
    const needsAttentionItems = playSources.value.filter(
      item => item.status === 'checking' || !item.lastCheckedAt,
    ).length;
    const checkedRecentlyItems = playSources.value.filter(item => {
      const hoursSince = getHoursSince(item.lastCheckedAt);
      return hoursSince !== null && hoursSince <= 24;
    }).length;

    return {
      total: totalItems,
      error: errorItems,
      needsAttention: needsAttentionItems,
      checkedRecently: checkedRecentlyItems,
    };
  });

  const activeQuickFilterKey = computed<QuickFilterKey | 'custom'>(() => {
    if (appliedStatus.value === 'error') {
      return 'error';
    }

    if (appliedStatus.value === 'checking') {
      return 'checking';
    }

    if (appliedStatus.value === 'active' && sortKey.value === 'priority:ASC') {
      return 'active';
    }

    if (!appliedStatus.value && sortKey.value === 'lastCheckedAt:ASC') {
      return 'stale';
    }

    if (!appliedStatus.value && sortKey.value === 'createdAt:DESC') {
      return 'all';
    }

    return 'custom';
  });

  const activeQuickFilterLabel = computed(() => {
    const activeOption = quickFilterOptions.find(option => option.key === activeQuickFilterKey.value);
    return activeOption?.label || '自定义组合';
  });
  const alertFilterLabel = computed(() => {
    const labelMap: Record<CrawlerAlertFilter, string> = {
      critical: '立即止损来源',
      high: '优先处理来源',
      stalled: '入库停滞来源',
      inactive: '无活跃源来源',
    };

    return activeAlertFilter.value ? labelMap[activeAlertFilter.value] : '';
  });
  const alertFilterRecommendation = computed(() => {
    return activeAlertFilter.value ? getAlertFilterRecommendedAction(activeAlertFilter.value) : null;
  });
  const focusedSourceAttentionItem = computed<AttentionSourceItem | null>(() => {
    return focusedSourceCollectionStats.value
      ? buildAttentionSourceItem(focusedSourceCollectionStats.value)
      : null;
  });
  const sourceHealthTone = computed(() => {
    const qualityScore = focusedSourceHealth.value?.qualityScore ?? 0;

    if (qualityScore >= 85) {
      return '优质稳定';
    }

    if (qualityScore >= 70) {
      return '可持续观察';
    }

    return '需要重点处理';
  });
  const defaultSourceRecommendation = computed(() => {
    const qualityScore = focusedSourceHealth.value?.qualityScore ?? focusedSourceCollectionStats.value?.qualityScore ?? 0;
    const activeRate = focusedSourceHealth.value?.activeRate ?? focusedSourceCollectionStats.value?.activeRate ?? 0;

    if (qualityScore >= 85 && activeRate >= 80) {
      return '该来源整体稳定，可继续保持现有采集与校验节奏。';
    }

    if (activeRate < 50) {
      return '该来源可用率偏低，建议优先检查最近失败链接、代理策略和来源页面结构是否变化。';
    }

    if (qualityScore < 70) {
      return '该来源质量分偏低，建议减少采集配额或重新评估可播放链接提取质量。';
    }

    return '建议持续观察该来源的最近校验和新增入库情况，必要时调整优先级与采集策略。';
  });

  const syncFiltersFromRoute = () => {
    type.value = normalizeQueryValue(route.query.type);
    source.value = normalizeQueryValue(route.query.source);
    search.value = normalizeQueryValue(route.query.search);
    status.value = normalizeQueryValue(route.query.status);
    sortKey.value = buildSortKey(
      normalizeQueryValue(route.query.sortBy),
      normalizeQueryValue(route.query.sortOrder),
    );
    page.value = normalizePageValue(route.query.page);
  };

  const buildRouteQuery = (nextPage = 1) => {
    const nextQuery: Record<string, string> = {};

    if (type.value) {
      nextQuery.type = type.value;
    }

    if (source.value) {
      nextQuery.source = source.value;
    }

    if (search.value) {
      nextQuery.search = search.value;
    }

    if (status.value) {
      nextQuery.status = status.value;
    }

    const parsedSort = parseSortKey(sortKey.value);
    nextQuery.sortBy = parsedSort.sortBy;
    nextQuery.sortOrder = parsedSort.sortOrder;

    if (nextPage > 1) {
      nextQuery.page = String(nextPage);
    }

    if (typeof route.query.focus === 'string' && route.query.focus) {
      nextQuery.focus = route.query.focus;
    }

    if (activeAlertFilter.value) {
      nextQuery.alertFilter = activeAlertFilter.value;
    }

    return nextQuery;
  };

  const updateRouteQuery = async (nextPage = 1) => {
    await router.replace({ query: buildRouteQuery(nextPage) });
  };

  const loadPlaySources = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const parsedSort = parseSortKey(sortKey.value);
      const response = await adminApi.getPlaySources({
        page: nextPage,
        limit: 10,
        type: type.value || undefined,
        source: source.value || undefined,
        sources:
          !source.value && alertFilteredSourceNames.value.length > 0
            ? alertFilteredSourceNames.value.join(',')
            : undefined,
        search: search.value || undefined,
        status: status.value || undefined,
        sortBy: parsedSort.sortBy,
        sortOrder: parsedSort.sortOrder,
      });

      playSources.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载播放源列表失败';
      playSources.value = [];
      total.value = 0;
      totalPages.value = 1;
    } finally {
      loading.value = false;
    }
  };

  const loadFocusedSourceContext = async () => {
    if (!focusedSourceName.value) {
      focusedSourceHealth.value = null;
      focusedSourceCollectionStats.value = null;
      sourceContextError.value = '';
      sourceContextLoading.value = false;
      return;
    }

    sourceContextLoading.value = true;
    sourceContextError.value = '';

    try {
      const [healthSummaries, statisticsResponse] = await Promise.all([
        crawlerApi.getSourceHealth(),
        crawlerApi.getStatistics(),
      ]);

      focusedSourceHealth.value =
        healthSummaries.find(item => item.name === focusedSourceName.value) || null;
      focusedSourceCollectionStats.value =
        statisticsResponse.data?.sources.find(item => item.name === focusedSourceName.value) || null;

      if (!focusedSourceHealth.value && !focusedSourceCollectionStats.value) {
        sourceContextError.value = '暂未匹配到该来源的健康摘要，可能还没有完整采集数据。';
      }
    } catch (error) {
      console.error('加载来源健康摘要失败:', error);
      focusedSourceHealth.value = null;
      focusedSourceCollectionStats.value = null;
      sourceContextError.value = '加载来源健康摘要失败，请稍后重试。';
    } finally {
      sourceContextLoading.value = false;
    }
  };

  const loadAlertFilteredSourceNames = async () => {
    const alertFilter = activeAlertFilter.value;

    if (focusedSourceName.value || !alertFilter) {
      alertFilteredSourceNames.value = [];
      return;
    }

    try {
      const response = await crawlerApi.getStatistics();
      alertFilteredSourceNames.value = (response.data?.sources || [])
        .filter(source => matchesCrawlerAlertFilter(source, alertFilter))
        .map(source => source.name);
    } catch (error) {
      console.error('加载告警来源筛选失败:', error);
      alertFilteredSourceNames.value = [];
    }
  };

  const applyFilters = async () => {
    await updateRouteQuery(1);
  };

  const resetFilters = async () => {
    type.value = '';
    source.value = '';
    search.value = '';
    status.value = '';
    sortKey.value = 'lastCheckedAt:ASC';
    await router.replace({ query: {} });
  };

  const clearSourceFilter = async () => {
    source.value = '';
    await updateRouteQuery(1);
  };

  const applyQuickFilter = async (key: QuickFilterKey) => {
    if (key === 'error') {
      status.value = 'error';
      sortKey.value = 'lastCheckedAt:ASC';
    } else if (key === 'checking') {
      status.value = 'checking';
      sortKey.value = 'lastCheckedAt:ASC';
    } else if (key === 'active') {
      status.value = 'active';
      sortKey.value = 'priority:ASC';
    } else if (key === 'all') {
      status.value = '';
      sortKey.value = 'createdAt:DESC';
    } else {
      status.value = '';
      sortKey.value = 'lastCheckedAt:ASC';
    }

    await updateRouteQuery(1);
  };

  const changePage = async (nextPage: number) => {
    await updateRouteQuery(nextPage);
  };

  const refreshPlaySources = async () => {
    syncFiltersFromRoute();
    await loadAlertFilteredSourceNames();
    await loadPlaySources(page.value);
    await loadFocusedSourceContext();
  };

  const getQuickFilterClass = (key: QuickFilterKey) => {
    const isActive = activeQuickFilterKey.value === key;

    return [
      'rounded-full px-3.5 py-2 text-sm font-medium transition',
      isActive
        ? 'bg-white text-slate-900 shadow-sm'
        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
    ];
  };

  const getAlertActionClass = (target: AlertActionTarget) => {
    return [
      'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition',
      alertFilterRecommendation.value?.target === target
        ? 'border border-rose-300/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
    ];
  };

  const getAlertActionLabel = (target: AlertActionTarget, fallbackLabel: string) => {
    return alertFilterRecommendation.value?.target === target
      ? `建议 · ${fallbackLabel}`
      : fallbackLabel;
  };

  const getFocusedSourceActionClass = (target: AlertActionTarget) => {
    return [
      'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition',
      focusedSourceAttentionItem.value?.recommendedAction.target === target
        ? 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
    ];
  };

  const getFocusedSourceActionLabel = (target: AlertActionTarget, fallbackLabel: string) => {
    return focusedSourceAttentionItem.value?.recommendedAction.target === target
      ? `建议 · ${fallbackLabel}`
      : fallbackLabel;
  };

  const buildCrawlerLink = () => {
    return {
      name: 'crawler',
      query: {
        source: focusedSourceName.value,
        focus: route.query.focus === 'attention' ? 'attention' : 'top',
      },
    };
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700';
      case 'checking':
        return 'rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700';
      case 'error':
        return 'rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700';
      default:
        return 'rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700';
    }
  };

  const getValidationSummary = (item: PlaySource) => {
    const validation = item.validationInfo as Record<string, unknown> | undefined;
    if (!validation) {
      if (item.type === 'magnet' && item.magnetInfo?.infoHash) {
        return `磁力 infoHash: ${item.magnetInfo.infoHash}`;
      }
      return '';
    }

    const strategy = typeof validation.strategy === 'string' ? validation.strategy : '';
    const message = typeof validation.message === 'string' ? validation.message : '';
    const contentType = typeof validation.contentType === 'string' ? validation.contentType : '';
    const providerName =
      typeof validation.providerName === 'string' ? validation.providerName : item.providerName || '';
    const infoHash = typeof validation.infoHash === 'string' ? validation.infoHash : item.magnetInfo?.infoHash;

    if (strategy === 'parser') {
      const playUrlCount = typeof validation.playUrlCount === 'number' ? validation.playUrlCount : 0;
      return ['解析器 ' + (providerName || '未指定'), 'playUrls ' + playUrlCount, message]
        .filter(Boolean)
        .join(' · ');
    }

    if (strategy === 'magnet') {
      return ['磁力 ' + (infoHash || '未知 hash'), message].filter(Boolean).join(' · ');
    }

    if (strategy === 'http') {
      const statusCode = typeof validation.statusCode === 'number' ? validation.statusCode : '';
      return [statusCode ? 'HTTP ' + statusCode : '', contentType, message]
        .filter(Boolean)
        .join(' · ');
    }

    return message;
  };

  const getPlaySourceRowClass = (item: PlaySource) => {
    const matchesFocusedSource =
      focusedSourceName.value.length > 0 &&
      [item.sourceName, item.name, item.mediaResource?.source]
        .filter((value): value is string => typeof value === 'string')
        .some(value => value.includes(focusedSourceName.value));

    if (item.status === 'error') {
      return matchesFocusedSource ? 'bg-rose-50 ring-1 ring-inset ring-rose-100' : 'bg-rose-50/70';
    }

    if (item.status === 'checking' || !item.lastCheckedAt) {
      return matchesFocusedSource
        ? 'bg-amber-50 ring-1 ring-inset ring-amber-100'
        : 'bg-amber-50/60';
    }

    return matchesFocusedSource ? 'bg-amber-50/60' : 'hover:bg-gray-50/80';
  };

  const formatDate = (value?: Date | string | null) => {
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleString('zh-CN');
  };

  watch(
    () => [
      route.query.page,
      route.query.type,
      route.query.source,
      route.query.search,
      route.query.status,
      route.query.sortBy,
      route.query.sortOrder,
      route.query.focus,
    ],
    () => {
      syncFiltersFromRoute();
      void loadPlaySources(page.value);
    },
    { immediate: true },
  );

  watch(
    () => focusedSourceName.value,
    () => {
      void loadFocusedSourceContext();
    },
    { immediate: true },
  );

  watch(
    () => activeAlertFilter.value,
    () => {
      void loadAlertFilteredSourceNames();
    },
    { immediate: true },
  );
</script>

<style scoped>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
