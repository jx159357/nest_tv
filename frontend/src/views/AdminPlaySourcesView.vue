<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--text-primary)">播放源管理</h1>
        <p class="mt-2" style="color: var(--text-muted)">按来源排查播放源状态、优先级和关联媒体</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-full px-4 py-2 text-sm font-medium transition"
          style="
            border: 1px solid var(--border-primary);
            background: var(--bg-card);
            color: var(--text-secondary);
          "
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
      <div
        class="flex flex-col gap-4 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div
            class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-emerald-100"
          >
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
      <div
        class="flex flex-col gap-4 px-6 py-5 text-white lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <div
            class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-rose-100"
          >
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
            :to="{ name: 'admin-crawler', query: { alertFilter: activeAlertFilter } }"
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
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-white"
          >
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
      <div
        class="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-lg ring-1 ring-slate-800"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-medium">来源健康摘要</h3>
            <p class="mt-1 text-sm text-slate-300">
              把质量分、可用率、最近入库和最近校验集中到同一页
            </p>
          </div>
          <span
            class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200"
          >
            {{ sourceHealthTone }}
          </span>
        </div>

        <div
          v-if="sourceContextLoading"
          class="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300"
        >
          正在加载来源健康摘要...
        </div>

        <div
          v-else-if="focusedSourceHealth || focusedSourceCollectionStats"
          class="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="text-xs text-slate-400">质量分</div>
            <div class="mt-2 text-2xl font-semibold text-white">
              {{
                focusedSourceHealth?.qualityScore ?? focusedSourceCollectionStats?.qualityScore ?? 0
              }}
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div class="text-xs text-slate-400">可用率</div>
            <div class="mt-2 text-2xl font-semibold text-white">
              {{
                focusedSourceHealth?.activeRate ?? focusedSourceCollectionStats?.activeRate ?? 0
              }}%
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
              {{
                focusedSourceHealth?.activePlaySources ??
                focusedSourceCollectionStats?.activePlaySources ??
                0
              }}
              /
              {{
                focusedSourceHealth?.totalPlaySources ??
                focusedSourceCollectionStats?.totalPlaySources ??
                0
              }}
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
              {{
                formatDate(
                  focusedSourceHealth?.latestCheckedAt ||
                    focusedSourceCollectionStats?.lastCheckedAt,
                )
              }}
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div class="text-xs text-slate-400">代理策略</div>
            <div class="mt-2">
              当前
              {{
                focusedSourceHealth?.proxyMode ||
                focusedSourceCollectionStats?.proxyMode ||
                'direct'
              }}
              <span v-if="focusedSourceHealth?.suggestedProxyMode" class="text-slate-400">
                · 建议 {{ focusedSourceHealth.suggestedProxyMode }}
              </span>
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <div class="text-xs text-slate-400">近24h新增源</div>
            <div class="mt-2">
              {{
                focusedSourceHealth?.recentPlaySources24h ??
                focusedSourceCollectionStats?.recentPlaySources24h ??
                0
              }}
            </div>
          </div>
        </div>
      </div>

      <div class="ops-card">
        <h3 class="ops-card-title">运维建议</h3>
        <p class="ops-card-desc">结合当前来源健康状态给出处理建议</p>

        <div v-if="sourceContextLoading" class="ops-loading-box">正在生成来源建议...</div>

        <div v-else-if="focusedSourceHealth || focusedSourceCollectionStats" class="mt-4 space-y-3">
          <div class="ops-recommendation-box">
            {{ focusedSourceHealth?.recommendation || defaultSourceRecommendation }}
          </div>

          <div v-if="focusedSourceAttentionItem" class="ops-attention-box">
            <div class="ops-attention-label">建议动作</div>
            <div class="ops-attention-title">
              {{ focusedSourceAttentionItem.recommendedAction.label }}
            </div>
            <div class="ops-attention-desc">
              {{ focusedSourceAttentionItem.recommendedAction.description }}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <router-link :to="buildCrawlerLink()" :class="getFocusedSourceActionClass('crawler')">
                {{ getFocusedSourceActionLabel('crawler', '来源策略') }}
              </router-link>
              <router-link
                :to="{
                  name: 'admin-play-sources',
                  query: { source: focusedSourceName, focus: route.query.focus || 'top' },
                }"
                :class="getFocusedSourceActionClass('play-sources')"
              >
                {{ getFocusedSourceActionLabel('play-sources', '当前播放源视图') }}
              </router-link>
            </div>
          </div>

          <div class="ops-troubleshoot-box">
            <div class="font-medium">排障建议</div>
            <ul class="mt-2 space-y-1 text-[13px]">
              <li>- 优先查看 `error` 与 `checking` 状态的播放源是否集中在同一批链接。</li>
              <li>- 若可用率偏低但质量分尚可，优先检查代理模式与最近校验时间。</li>
              <li>- 若最近入库为空，优先返回来源策略页排查采集链路是否停滞。</li>
            </ul>
          </div>
        </div>

        <div v-else class="ops-loading-box">
          {{ sourceContextError || '当前来源尚未生成可展示的健康摘要。' }}
        </div>
      </div>
    </div>

    <form class="filter-form" @submit.prevent="applyFilters">
      <div
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_160px_180px_220px_auto]"
      >
        <label class="flex flex-col gap-2">
          <span class="filter-label">来源筛选</span>
          <input
            v-model.trim="source"
            type="text"
            placeholder="如：豆瓣电影、量子源"
            class="filter-input"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="filter-label">搜索关键词</span>
          <input
            v-model.trim="search"
            type="text"
            placeholder="搜索媒体标题、链接、来源名"
            class="filter-input"
          />
        </label>

        <label class="flex flex-col gap-2">
          <span class="filter-label">类型</span>
          <select v-model="type" class="filter-input" @change="applyFilters">
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
          <span class="filter-label">状态</span>
          <select v-model="status" class="filter-input" @change="applyFilters">
            <option value="">全部状态</option>
            <option value="active">active</option>
            <option value="checking">checking</option>
            <option value="error">error</option>
            <option value="inactive">inactive</option>
          </select>
        </label>

        <label class="flex flex-col gap-2">
          <span class="filter-label">排序</span>
          <select v-model="sortKey" class="filter-input" @change="applyFilters">
            <option value="lastCheckedAt:ASC">最久未校验优先</option>
            <option value="lastCheckedAt:DESC">最近已校验优先</option>
            <option value="createdAt:DESC">最新创建优先</option>
            <option value="priority:ASC">高优先级优先</option>
          </select>
        </label>

        <div class="flex flex-wrap items-end gap-2">
          <button type="submit" class="btn-primary">应用筛选</button>
          <button type="button" class="btn-secondary" @click="resetFilters">重置</button>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="filter-tags">
        <span class="filter-tag-default">筛选已生效</span>
        <span v-if="focusedSourceName" class="filter-tag-emerald">
          来源：{{ focusedSourceName }}
        </span>
        <span v-if="appliedSearch" class="filter-tag-indigo">搜索：{{ appliedSearch }}</span>
        <span v-if="appliedType" class="filter-tag-amber">类型：{{ appliedType }}</span>
        <span v-if="appliedStatus" class="filter-tag-rose">状态：{{ appliedStatus }}</span>
        <span class="filter-tag-slate">排序：{{ sortLabel }}</span>
      </div>
    </form>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.05fr)]">
      <div
        class="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 p-5 text-white shadow-lg ring-1 ring-slate-800"
      >
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-medium">快捷切换</h3>
            <p class="mt-1 text-sm text-slate-300">一键切到异常源、检查中或久未校验来源</p>
          </div>
          <span
            class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
          >
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
        <div class="stat-card">
          <div class="stat-card-label">当前页条目</div>
          <div class="stat-card-value">{{ currentPageStats.total }}</div>
          <div class="stat-card-hint">当前筛选结果</div>
        </div>
        <div class="stat-card stat-card-rose">
          <div class="stat-card-label-rose">异常源</div>
          <div class="stat-card-value-rose">{{ currentPageStats.error }}</div>
          <div class="stat-card-hint-rose">状态为 error</div>
        </div>
        <div class="stat-card stat-card-amber">
          <div class="stat-card-label-amber">待校验 / 检查中</div>
          <div class="stat-card-value-amber">{{ currentPageStats.needsAttention }}</div>
          <div class="stat-card-hint-amber">checking 或尚无校验时间</div>
        </div>
        <div class="stat-card stat-card-emerald">
          <div class="stat-card-label-emerald">近24h已校验</div>
          <div class="stat-card-value-emerald">{{ currentPageStats.checkedRecently }}</div>
          <div class="stat-card-hint-emerald">适合判断近期稳定性</div>
        </div>
      </div>
    </div>

    <div v-if="selectedIds.size > 0" class="batch-action-bar">
      <div class="batch-action-info">
        已选择 <strong>{{ selectedIds.size }}</strong> 条播放源
      </div>
      <div class="batch-action-buttons">
        <button
          class="batch-btn batch-btn-enable"
          :disabled="batchLoading"
          @click="executeBatch('enable')"
        >
          批量启用
        </button>
        <button
          class="batch-btn batch-btn-disable"
          :disabled="batchLoading"
          @click="executeBatch('disable')"
        >
          批量禁用
        </button>
        <button
          class="batch-btn batch-btn-delete"
          :disabled="batchLoading"
          @click="executeBatch('delete')"
        >
          批量删除
        </button>
        <button class="batch-btn batch-btn-cancel" @click="clearSelection">取消选择</button>
      </div>
    </div>

    <div class="table-container">
      <div v-if="loading" class="p-8 text-center" style="color: var(--text-muted)">加载中...</div>
      <div v-else-if="error" class="p-8 text-center" style="color: var(--color-danger)">
        {{ error }}
      </div>
      <template v-else>
        <div v-if="playSources.length === 0" class="p-10 text-center">
          <div class="mx-auto max-w-md">
            <h3 class="text-base font-semibold" style="color: var(--text-primary)">
              未找到匹配的播放源
            </h3>
            <p class="mt-2 text-sm leading-6" style="color: var(--text-muted)">
              可以尝试放宽来源或搜索关键词，或者返回爬虫页继续检查采集策略和来源可用性。
            </p>
            <p v-if="focusedSourceAttentionItem" class="ops-attention-box mt-3 text-left text-sm">
              <span class="ops-attention-label">建议动作</span>
              <span class="ops-attention-title">
                {{ focusedSourceAttentionItem.recommendedAction.label }}
              </span>
              <span class="ops-attention-desc">
                {{ focusedSourceAttentionItem.recommendedAction.description }}
              </span>
            </p>
            <p
              v-else-if="alertFilterRecommendation"
              class="mt-3 rounded-2xl p-4 text-left text-sm"
              style="
                border: 1px solid var(--color-danger-border);
                background: var(--color-danger-bg);
                color: var(--color-danger);
              "
            >
              <span class="block text-xs" style="color: var(--color-danger)">告警建议</span>
              <span class="mt-1 block font-medium" style="color: var(--text-primary)">
                {{ alertFilterRecommendation.label }}
              </span>
              <span class="mt-1 block text-[13px]" style="color: var(--text-secondary)">
                {{ alertFilterRecommendation.description }}
              </span>
            </p>
            <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button class="btn-secondary" @click="resetFilters">清空筛选</button>
              <router-link
                v-if="focusedSourceName"
                :to="buildCrawlerLink()"
                :class="getFocusedSourceActionClass('crawler')"
              >
                {{ getFocusedSourceActionLabel('crawler', '查看来源策略') }}
              </router-link>
              <router-link
                v-if="focusedSourceAttentionItem"
                :to="{
                  name: 'admin-play-sources',
                  query: { source: focusedSourceName, focus: route.query.focus || 'top' },
                }"
                :class="getFocusedSourceActionClass('play-sources')"
              >
                {{ getFocusedSourceActionLabel('play-sources', '保持播放源视图') }}
              </router-link>
              <router-link
                v-else-if="alertFilterRecommendation"
                :to="{ name: 'admin-crawler', query: { alertFilter: activeAlertFilter } }"
                :class="getAlertActionClass('crawler')"
              >
                {{ getAlertActionLabel('crawler', '来源视图') }}
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="toggleSelectAll"
                  />
                </th>
                <th>来源</th>
                <th>媒体</th>
                <th>类型</th>
                <th>状态</th>
                <th>成功率</th>
                <th>优先级</th>
                <th>最后校验</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in playSources" :key="item.id" :class="getPlaySourceRowClass(item)">
                <td class="checkbox-col">
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(item.id)"
                    @change="toggleSelect(item.id)"
                  />
                </td>
                <td>
                  <div class="font-medium" style="color: var(--text-primary)">
                    {{ item.sourceName || item.name || '未命名播放源' }}
                  </div>
                  <div class="line-clamp-1 text-xs" style="color: var(--text-muted)">
                    {{ item.url }}
                  </div>
                  <div
                    v-if="getValidationSummary(item)"
                    class="mt-1 line-clamp-2 text-xs"
                    style="color: var(--text-muted)"
                  >
                    {{ getValidationSummary(item) }}
                  </div>
                </td>
                <td style="color: var(--text-secondary)">
                  <div>{{ item.mediaResource?.title || `#${item.mediaResourceId}` }}</div>
                  <div
                    v-if="item.mediaResource?.source"
                    class="text-xs"
                    style="color: var(--text-muted)"
                  >
                    资源来源：{{ item.mediaResource.source }}
                  </div>
                </td>
                <td style="color: var(--text-secondary)">{{ item.type }}</td>
                <td>
                  <span :class="getStatusClass(item.status)">{{ item.status }}</span>
                </td>
                <td>
                  <span :class="getSuccessRateClass(item)">
                    {{ formatSuccessRate(item) }}
                  </span>
                </td>
                <td style="color: var(--text-secondary)">{{ item.priority }}</td>
                <td style="color: var(--text-secondary)">{{ formatDate(item.lastCheckedAt) }}</td>
                <td style="color: var(--text-secondary)">{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3 self-end md:self-auto">
            <button :disabled="page <= 1" class="pagination-btn" @click="changePage(page - 1)">
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="pagination-btn"
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
  import { playSourceApi } from '@/api/playSource';
  import { log } from '@/utils/logger';
  import { showConfirm, notifySuccess, notifyError } from '@/composables/useModal';

  const route = useRoute();
  const router = useRouter();

  const playSources = ref<PlaySource[]>([]);
  const loading = ref(false);
  const selectedIds = ref<Set<number>>(new Set());
  const batchLoading = ref(false);
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
    const activeOption = quickFilterOptions.find(
      option => option.key === activeQuickFilterKey.value,
    );
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
    return activeAlertFilter.value
      ? getAlertFilterRecommendedAction(activeAlertFilter.value)
      : null;
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
    const qualityScore =
      focusedSourceHealth.value?.qualityScore ??
      focusedSourceCollectionStats.value?.qualityScore ??
      0;
    const activeRate =
      focusedSourceHealth.value?.activeRate ?? focusedSourceCollectionStats.value?.activeRate ?? 0;

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
        statisticsResponse.data?.sources.find(item => item.name === focusedSourceName.value) ||
        null;

      if (!focusedSourceHealth.value && !focusedSourceCollectionStats.value) {
        sourceContextError.value = '暂未匹配到该来源的健康摘要，可能还没有完整采集数据。';
      }
    } catch (error) {
      log.error('AdminPlaySources', '加载来源健康摘要失败:', error);
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
      log.error('AdminPlaySources', '加载告警来源筛选失败:', error);
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

  const isAllSelected = computed(() => {
    return (
      playSources.value.length > 0 &&
      playSources.value.every(item => selectedIds.value.has(item.id))
    );
  });

  const isIndeterminate = computed(() => {
    const count = playSources.value.filter(item => selectedIds.value.has(item.id)).length;
    return count > 0 && count < playSources.value.length;
  });

  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      selectedIds.value.clear();
    } else {
      for (const item of playSources.value) {
        selectedIds.value.add(item.id);
      }
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id);
    } else {
      selectedIds.value.add(id);
    }
  };

  const clearSelection = () => {
    selectedIds.value.clear();
  };

  const executeBatch = async (action: 'enable' | 'disable' | 'delete') => {
    const ids = [...selectedIds.value];
    if (ids.length === 0) return;

    const actionLabel = action === 'enable' ? '启用' : action === 'disable' ? '禁用' : '删除';

    const doBatch = async () => {
      batchLoading.value = true;
      try {
        if (action === 'enable') {
          await playSourceApi.batchEnable(ids);
        } else if (action === 'disable') {
          await playSourceApi.batchDisable(ids);
        } else {
          await playSourceApi.batchDelete(ids);
        }
        selectedIds.value.clear();
        await loadPlaySources(page.value);
        notifySuccess('批量操作', `批量${actionLabel}成功`);
      } catch (err) {
        log.error('AdminPlaySources', `批量${actionLabel}失败:`, err);
        notifyError('批量操作失败', `批量${actionLabel}失败，请稍后重试`);
      } finally {
        batchLoading.value = false;
      }
    };

    if (action === 'delete') {
      showConfirm(`确认删除 ${ids.length} 条播放源？此操作不可撤销。`, doBatch, '确认删除');
    } else {
      await doBatch();
    }
  };

  const getQuickFilterClass = (key: QuickFilterKey) => {
    const isActive = activeQuickFilterKey.value === key;

    return [
      'rounded-full px-3.5 py-2 text-sm font-medium transition',
      isActive
        ? 'ps-quick-filter--active'
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
        ? 'border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
    ];
  };

  const getFocusedSourceActionLabel = (target: AlertActionTarget, fallbackLabel: string) => {
    return focusedSourceAttentionItem.value?.recommendedAction.target === target
      ? `建议 · ${fallbackLabel}`
      : fallbackLabel;
  };

  const buildCrawlerLink = () => {
    return {
      name: 'admin-crawler',
      query: {
        source: focusedSourceName.value,
        focus: route.query.focus === 'attention' ? 'attention' : 'top',
      },
    };
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'checking':
        return 'status-badge status-checking';
      case 'error':
        return 'status-badge status-error';
      default:
        return 'status-badge status-default';
    }
  };

  const formatSuccessRate = (item: PlaySource) => {
    const attempts = item.playAttemptCount ?? 0;
    if (attempts === 0) return '—';
    const successes = item.playSuccessCount ?? 0;
    return `${Math.round((successes / attempts) * 100)}%`;
  };

  const getSuccessRateClass = (item: PlaySource) => {
    const attempts = item.playAttemptCount ?? 0;
    if (attempts === 0) return 'rate-badge rate-unknown';
    const successes = item.playSuccessCount ?? 0;
    const rate = (successes / attempts) * 100;
    if (rate >= 80) return 'rate-badge rate-high';
    if (rate >= 50) return 'rate-badge rate-medium';
    return 'rate-badge rate-low';
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
      typeof validation.providerName === 'string'
        ? validation.providerName
        : item.providerName || '';
    const infoHash =
      typeof validation.infoHash === 'string' ? validation.infoHash : item.magnetInfo?.infoHash;

    if (strategy === 'parser') {
      const playUrlCount =
        typeof validation.playUrlCount === 'number' ? validation.playUrlCount : 0;
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
      return matchesFocusedSource ? 'row-error row-highlight' : 'row-error';
    }

    if (item.status === 'checking' || !item.lastCheckedAt) {
      return matchesFocusedSource ? 'row-checking row-highlight' : 'row-checking';
    }

    return matchesFocusedSource ? 'row-highlight' : 'row-default';
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

  .ps-quick-filter--active {
    background: var(--color-brand-primary, #6366f1);
    color: var(--text-inverse);
    box-shadow: var(--shadow-sm);
  }

  .ops-card {
    background: var(--admin-bg-card);
    border: 1px solid var(--admin-border);
    border-radius: var(--panel-radius);
    padding: 20px;
    box-shadow: var(--admin-shadow);
  }

  .ops-card-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .ops-card-desc {
    margin-top: 4px;
    font-size: 14px;
    color: var(--text-muted);
  }

  .ops-loading-box {
    margin-top: 16px;
    border: 1px dashed var(--admin-border);
    background: var(--bg-secondary);
    border-radius: var(--panel-radius);
    padding: 16px;
    font-size: 14px;
    color: var(--text-muted);
  }

  .ops-recommendation-box {
    border-radius: var(--panel-radius);
    border: 1px solid var(--admin-border);
    background: var(--bg-secondary);
    padding: 16px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .ops-attention-box {
    border-radius: var(--panel-radius);
    border: 1px solid var(--color-warning-border, rgba(245, 158, 11, 0.3));
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.08));
    padding: 16px;
    font-size: 14px;
    color: var(--color-warning, #f59e0b);
  }

  .ops-attention-label {
    font-size: 12px;
    color: var(--color-warning, #f59e0b);
  }

  .ops-attention-title {
    margin-top: 8px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .ops-attention-desc {
    margin-top: 4px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .ops-troubleshoot-box {
    border-radius: var(--panel-radius);
    border: 1px solid var(--color-warning-border, rgba(245, 158, 11, 0.3));
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.08));
    padding: 16px;
    font-size: 14px;
    color: var(--color-warning, #f59e0b);
  }

  .filter-form {
    border-radius: var(--panel-radius);
    border: 1px solid var(--admin-border);
    background: var(--admin-bg-card);
    padding: 20px;
    box-shadow: var(--admin-shadow);
  }

  .filter-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .filter-input {
    min-height: 38px;
    border-radius: var(--radius-control);
    border: 1px solid var(--border-secondary);
    padding: 0 14px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .filter-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px var(--color-info-overlay);
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    border-radius: var(--radius-control);
    padding: 0 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-inverse);
    background: var(--color-brand-primary, #6366f1);
    transition: all 0.2s;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    border-radius: var(--radius-control);
    border: 1px solid var(--border-secondary);
    padding: 0 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-card);
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--bg-secondary);
  }

  .filter-tags {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .filter-tag-default {
    border-radius: 9999px;
    background: var(--bg-secondary);
    padding: 4px 10px;
  }

  .filter-tag-emerald {
    border-radius: 9999px;
    background: var(--color-success-overlay);
    padding: 4px 10px;
    color: var(--color-success, #10b981);
  }

  .filter-tag-indigo {
    border-radius: 9999px;
    background: var(--color-info-overlay);
    padding: 4px 10px;
    color: var(--color-brand-primary-light, #818cf8);
  }

  .filter-tag-amber {
    border-radius: 9999px;
    background: var(--color-warning-overlay);
    padding: 4px 10px;
    color: var(--color-warning, #f59e0b);
  }

  .filter-tag-rose {
    border-radius: 9999px;
    background: var(--color-error-overlay);
    padding: 4px 10px;
    color: var(--color-danger, #f43f5e);
  }

  .filter-tag-slate {
    border-radius: 9999px;
    background: var(--bg-secondary);
    padding: 4px 10px;
    color: var(--text-muted);
  }

  .stat-card {
    border-radius: var(--panel-radius);
    border: 1px solid var(--admin-border);
    background: var(--admin-bg-card);
    padding: 16px;
    box-shadow: var(--admin-shadow);
  }

  .stat-card-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .stat-card-value {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .stat-card-hint {
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .stat-card-rose {
    border-color: var(--color-danger-border, rgba(244, 63, 94, 0.2));
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.05));
  }

  .stat-card-label-rose {
    font-size: 12px;
    color: var(--color-danger, #f43f5e);
  }

  .stat-card-value-rose {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-danger, #f43f5e);
  }

  .stat-card-hint-rose {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-danger, #f43f5e);
    opacity: 0.7;
  }

  .stat-card-amber {
    border-color: var(--color-warning-border, rgba(245, 158, 11, 0.2));
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.05));
  }

  .stat-card-label-amber {
    font-size: 12px;
    color: var(--color-warning, #f59e0b);
  }

  .stat-card-value-amber {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-warning, #f59e0b);
  }

  .stat-card-hint-amber {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-warning, #f59e0b);
    opacity: 0.7;
  }

  .stat-card-emerald {
    border-color: var(--color-success-border, rgba(16, 185, 129, 0.2));
    background: var(--color-success-bg, rgba(16, 185, 129, 0.05));
  }

  .stat-card-label-emerald {
    font-size: 12px;
    color: var(--color-success, #10b981);
  }

  .stat-card-value-emerald {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-success, #10b981);
  }

  .stat-card-hint-emerald {
    margin-top: 4px;
    font-size: 12px;
    color: var(--color-success, #10b981);
    opacity: 0.7;
  }

  .table-container {
    border-radius: var(--panel-radius);
    border: 1px solid var(--admin-border);
    background: var(--admin-bg-card);
    box-shadow: var(--admin-shadow);
    overflow: hidden;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .data-table thead {
    background: var(--bg-secondary);
  }

  .data-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .data-table tbody {
    border-top: 1px solid var(--border-primary);
  }

  .data-table td {
    padding: 12px 16px;
    font-size: 14px;
  }

  .data-table tbody tr {
    border-bottom: 1px solid var(--border-primary);
    transition: background 0.15s;
  }

  .data-table tbody tr:last-child {
    border-bottom: none;
  }

  .row-default:hover {
    background: var(--bg-secondary);
  }

  .row-error {
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.06));
  }

  .row-checking {
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.06));
  }

  .row-highlight {
    outline: 1px solid var(--border-focus);
    outline-offset: -1px;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-active {
    background: var(--color-success-bg, rgba(16, 185, 129, 0.15));
    color: var(--color-success, #10b981);
  }

  .status-checking {
    background: var(--color-info-bg, rgba(14, 165, 233, 0.15));
    color: var(--color-info, #0ea5e9);
  }

  .status-error {
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.15));
    color: var(--color-danger, #f43f5e);
  }

  .status-default {
    background: var(--bg-secondary);
    color: var(--text-muted);
  }

  .rate-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
  }

  .rate-high {
    background: var(--color-success-bg, rgba(16, 185, 129, 0.15));
    color: var(--color-success, #10b981);
  }

  .rate-medium {
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.15));
    color: var(--color-warning, #f59e0b);
  }

  .rate-low {
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.15));
    color: var(--color-danger, #f43f5e);
  }

  .rate-unknown {
    background: var(--bg-secondary);
    color: var(--text-muted);
  }

  .checkbox-col {
    width: 40px;
    text-align: center;
  }

  .checkbox-col input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--color-brand-primary);
  }

  .batch-action-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-radius: var(--panel-radius);
    border: 1px solid var(--color-brand-border);
    background: var(--color-brand-overlay);
    padding: 12px 16px;
  }

  .batch-action-info {
    font-size: 14px;
    color: var(--text-secondary);
  }

  .batch-action-info strong {
    color: var(--color-brand-primary);
    font-weight: 600;
  }

  .batch-action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .batch-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    border-radius: var(--radius-control);
    padding: 0 14px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
  }

  .batch-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .batch-btn-enable {
    background: var(--color-success-bg, rgba(16, 185, 129, 0.15));
    color: var(--color-success, #10b981);
    border-color: var(--color-success-border, rgba(16, 185, 129, 0.3));
  }

  .batch-btn-enable:hover:not(:disabled) {
    background: var(--color-success-bg, rgba(16, 185, 129, 0.25));
  }

  .batch-btn-disable {
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.15));
    color: var(--color-warning, #f59e0b);
    border-color: var(--color-warning-border, rgba(245, 158, 11, 0.3));
  }

  .batch-btn-disable:hover:not(:disabled) {
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.25));
  }

  .batch-btn-delete {
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.15));
    color: var(--color-danger, #f43f5e);
    border-color: var(--color-danger-border, rgba(244, 63, 94, 0.3));
  }

  .batch-btn-delete:hover:not(:disabled) {
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.25));
  }

  .batch-btn-cancel {
    background: var(--bg-secondary);
    color: var(--text-secondary);
    border-color: var(--border-secondary);
  }

  .batch-btn-cancel:hover {
    background: var(--bg-card);
  }

  .table-footer {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid var(--border-primary);
    padding: 12px 16px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  @media (min-width: 768px) {
    .table-footer {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .pagination-btn {
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
    padding: 6px 12px;
    font-size: 14px;
    color: var(--text-secondary);
    background: var(--bg-card);
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination-btn:hover:not(:disabled) {
    background: var(--bg-secondary);
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
