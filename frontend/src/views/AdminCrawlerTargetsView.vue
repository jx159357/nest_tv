<template>
  <div class="crawler-targets">
    <div class="crawler-targets__header">
      <div>
        <h1 class="crawler-targets__title">数据源管理</h1>
        <p class="crawler-targets__subtitle">管理爬虫数据源配置，选择前台展示的数据源</p>
      </div>
      <button class="crawler-targets__add-btn" @click="showCreateDialog = true">
        + 添加数据源
      </button>
    </div>

    <div v-if="loading" class="crawler-targets__loading">
      <div class="crawler-targets__spinner"></div>
      <span>加载中...</span>
    </div>

    <EmptyState
      v-else-if="targets.length === 0"
      title="暂无数据源"
      description="点击上方按钮添加爬虫目标"
      icon="light"
    />

    <div v-else class="crawler-targets__grid">
      <div
        v-for="target in targets"
        :key="target.id"
        :class="['crawler-targets__card', { 'crawler-targets__card--active': target.isActive }]"
      >
        <div class="crawler-targets__card-header">
          <div class="crawler-targets__card-info">
            <h3 class="crawler-targets__card-name">{{ target.name }}</h3>
            <span
              :class="[
                'crawler-targets__status',
                target.enabled
                  ? 'crawler-targets__status--enabled'
                  : 'crawler-targets__status--disabled',
              ]"
            >
              {{ target.enabled ? '已启用' : '已禁用' }}
            </span>
            <span
              v-if="target.isActive"
              class="crawler-targets__status crawler-targets__status--active"
            >
              前台展示中
            </span>
          </div>
          <div class="crawler-targets__card-actions">
            <button
              v-if="target.enabled && !target.isActive"
              class="crawler-targets__action-btn crawler-targets__action-btn--activate"
              @click="handleActivate(target)"
            >
              激活
            </button>
            <button
              v-if="target.isActive"
              class="crawler-targets__action-btn crawler-targets__action-btn--deactivate"
              @click="handleDeactivate(target)"
            >
              取消激活
            </button>
            <button
              :class="[
                'crawler-targets__action-btn',
                target.enabled
                  ? 'crawler-targets__action-btn--disable'
                  : 'crawler-targets__action-btn--enable',
              ]"
              @click="handleToggleEnabled(target)"
            >
              {{ target.enabled ? '禁用' : '启用' }}
            </button>
            <button
              class="crawler-targets__action-btn crawler-targets__action-btn--edit"
              @click="handleEdit(target)"
            >
              编辑
            </button>
            <button
              v-if="!target.isActive"
              class="crawler-targets__action-btn crawler-targets__action-btn--delete"
              @click="handleDelete(target)"
            >
              删除
            </button>
          </div>
        </div>

        <div class="crawler-targets__card-body">
          <div class="crawler-targets__card-url">
            <span class="crawler-targets__label">网址:</span>
            <a :href="target.baseUrl" target="_blank" rel="noopener noreferrer">{{
              target.baseUrl
            }}</a>
          </div>
          <p v-if="target.description" class="crawler-targets__card-desc">
            {{ target.description }}
          </p>
          <div class="crawler-targets__card-meta">
            <span>优先级: {{ target.priority }}</span>
            <span>最大页数: {{ target.maxPages }}</span>
            <span>请求间隔: {{ target.requestDelay }}ms</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <div
      v-if="showCreateDialog || editingTarget"
      class="crawler-targets__dialog-overlay"
      @click.self="closeDialog"
    >
      <div class="crawler-targets__dialog">
        <h2 class="crawler-targets__dialog-title">
          {{ editingTarget ? '编辑数据源' : '添加数据源' }}
        </h2>
        <form class="crawler-targets__form" @submit.prevent="handleSubmit">
          <div class="crawler-targets__form-group">
            <label class="crawler-targets__form-label">名称 *</label>
            <input
              v-model="formData.name"
              type="text"
              class="crawler-targets__form-input"
              required
            />
          </div>
          <div class="crawler-targets__form-group">
            <label class="crawler-targets__form-label">基础URL *</label>
            <input
              v-model="formData.baseUrl"
              type="url"
              class="crawler-targets__form-input"
              required
            />
          </div>
          <div class="crawler-targets__form-group">
            <label class="crawler-targets__form-label">描述</label>
            <textarea
              v-model="formData.description"
              class="crawler-targets__form-textarea"
              rows="2"
            ></textarea>
          </div>
          <div class="crawler-targets__form-row">
            <div class="crawler-targets__form-group">
              <label class="crawler-targets__form-label">优先级</label>
              <input
                v-model.number="formData.priority"
                type="number"
                class="crawler-targets__form-input"
                min="0"
              />
            </div>
            <div class="crawler-targets__form-group">
              <label class="crawler-targets__form-label">最大页数</label>
              <input
                v-model.number="formData.maxPages"
                type="number"
                class="crawler-targets__form-input"
                min="1"
              />
            </div>
            <div class="crawler-targets__form-group">
              <label class="crawler-targets__form-label">请求间隔(ms)</label>
              <input
                v-model.number="formData.requestDelay"
                type="number"
                class="crawler-targets__form-input"
                min="500"
              />
            </div>
          </div>
          <div class="crawler-targets__form-group">
            <label class="crawler-targets__form-label">
              <input v-model="formData.enabled" type="checkbox" />
              启用
            </label>
          </div>

          <h3 class="crawler-targets__form-subtitle">CSS选择器配置</h3>
          <template v-if="formData.selectors">
            <div class="crawler-targets__form-row">
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">标题</label>
                <input
                  v-model="formData.selectors.title"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">描述</label>
                <input
                  v-model="formData.selectors.description"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
            </div>
            <div class="crawler-targets__form-row">
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">海报</label>
                <input
                  v-model="formData.selectors.poster"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">评分</label>
                <input
                  v-model="formData.selectors.rating"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
            </div>
            <div class="crawler-targets__form-row">
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">导演</label>
                <input
                  v-model="formData.selectors.director"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">演员</label>
                <input
                  v-model="formData.selectors.actors"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
            </div>
            <div class="crawler-targets__form-row">
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">类型</label>
                <input
                  v-model="formData.selectors.genres"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
              <div class="crawler-targets__form-group">
                <label class="crawler-targets__form-label">上映日期</label>
                <input
                  v-model="formData.selectors.releaseDate"
                  type="text"
                  class="crawler-targets__form-input"
                />
              </div>
            </div>
            <div class="crawler-targets__form-group">
              <label class="crawler-targets__form-label">下载链接</label>
              <input
                v-model="formData.selectors.downloadUrls"
                type="text"
                class="crawler-targets__form-input"
              />
            </div>
          </template>

          <div class="crawler-targets__form-group">
            <label class="crawler-targets__form-label">列表页URL（每行一个）</label>
            <textarea
              v-model="listingUrlsText"
              class="crawler-targets__form-textarea"
              rows="4"
              placeholder="https://example.com/list1.html&#10;https://example.com/list2.html"
            ></textarea>
          </div>

          <div class="crawler-targets__form-actions">
            <button type="button" class="crawler-targets__form-cancel" @click="closeDialog">
              取消
            </button>
            <button type="submit" class="crawler-targets__form-submit" :disabled="submitting">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { adminApi } from '@/api/admin';
  import type { AdminCrawlerTarget } from '@/api/admin';
  import EmptyState from '@/components/EmptyState.vue';
  import { showConfirm, notifySuccess, notifyError } from '@/composables/useModal';
  import { log } from '@/utils/logger';

  const targets = ref<AdminCrawlerTarget[]>([]);
  const loading = ref(true);
  const showCreateDialog = ref(false);
  const editingTarget = ref<AdminCrawlerTarget | null>(null);
  const submitting = ref(false);

  const defaultFormData = (): Partial<AdminCrawlerTarget> => ({
    name: '',
    baseUrl: '',
    description: '',
    enabled: true,
    isActive: false,
    priority: 0,
    maxPages: 50,
    requestDelay: 2000,
    respectRobotsTxt: true,
    selectors: {
      title: 'h1',
      description: '',
      poster: '',
      rating: '',
      director: '',
      actors: '',
      genres: '',
      releaseDate: '',
      downloadUrls: '',
    },
    listingUrls: [],
  });

  const formData = ref<Partial<AdminCrawlerTarget>>(defaultFormData());

  const listingUrlsText = computed({
    get: () => (formData.value.listingUrls || []).join('\n'),
    set: (val: string) => {
      formData.value.listingUrls = val
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);
    },
  });

  const loadTargets = async () => {
    loading.value = true;
    try {
      targets.value = await adminApi.getCrawlerTargets();
    } catch (error) {
      log.error('AdminCrawlerTargets', '加载数据源失败:', error);
      notifyError('加载失败', '无法加载数据源列表');
    } finally {
      loading.value = false;
    }
  };

  const handleEdit = (target: AdminCrawlerTarget) => {
    editingTarget.value = target;
    formData.value = { ...target, selectors: { ...target.selectors } };
  };

  const handleActivate = (target: AdminCrawlerTarget) => {
    showConfirm(`确定激活数据源"${target.name}"吗？`, async () => {
      try {
        await adminApi.activateCrawlerTarget(target.id);
        notifySuccess('激活成功', `数据源"${target.name}"已激活为前台展示`);
        await loadTargets();
      } catch (error) {
        log.error('AdminCrawlerTargets', '激活失败:', error);
        notifyError('激活失败', String(error));
      }
    });
  };

  const handleDeactivate = (target: AdminCrawlerTarget) => {
    showConfirm(`确定取消激活数据源"${target.name}"吗？`, async () => {
      try {
        await adminApi.deactivateCrawlerTarget(target.id);
        notifySuccess('取消激活成功', `数据源"${target.name}"已取消前台展示`);
        await loadTargets();
      } catch (error) {
        log.error('AdminCrawlerTargets', '取消激活失败:', error);
        notifyError('取消激活失败', String(error));
      }
    });
  };

  const handleToggleEnabled = (target: AdminCrawlerTarget) => {
    const action = target.enabled ? '禁用' : '启用';
    showConfirm(`确定${action}数据源"${target.name}"吗？`, async () => {
      try {
        await adminApi.toggleCrawlerTargetEnabled(target.id);
        notifySuccess(`${action}成功`, `数据源"${target.name}"已${action}`);
        await loadTargets();
      } catch (error) {
        log.error('AdminCrawlerTargets', '切换状态失败:', error);
        notifyError(`${action}失败`, String(error));
      }
    });
  };

  const handleDelete = (target: AdminCrawlerTarget) => {
    showConfirm(`确定删除数据源"${target.name}"吗？`, async () => {
      try {
        await adminApi.deleteCrawlerTarget(target.id);
        notifySuccess('删除成功', `数据源"${target.name}"已删除`);
        await loadTargets();
      } catch (error) {
        log.error('AdminCrawlerTargets', '删除失败:', error);
        notifyError('删除失败', String(error));
      }
    });
  };

  const handleSubmit = async () => {
    submitting.value = true;
    try {
      if (editingTarget.value) {
        await adminApi.updateCrawlerTarget(editingTarget.value.id, formData.value);
        notifySuccess('编辑成功', `数据源"${editingTarget.value.name}"已更新`);
      } else {
        await adminApi.createCrawlerTarget(formData.value);
        notifySuccess('创建成功', '新数据源已添加');
      }
      closeDialog();
      await loadTargets();
    } catch (error) {
      log.error('AdminCrawlerTargets', '保存失败:', error);
      notifyError('保存失败', String(error));
    } finally {
      submitting.value = false;
    }
  };

  const closeDialog = () => {
    showCreateDialog.value = false;
    editingTarget.value = null;
    formData.value = defaultFormData();
  };

  onMounted(loadTargets);
</script>

<style scoped>
  .crawler-targets {
    padding: var(--spacing-6);
    max-width: 1200px;
    margin: 0 auto;
  }

  .crawler-targets__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-6);
  }

  .crawler-targets__title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
  }

  .crawler-targets__subtitle {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-top: var(--spacing-1);
  }

  .crawler-targets__add-btn {
    padding: var(--spacing-2) var(--spacing-4);
    background: var(--color-brand-primary);
    color: var(--text-inverse);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .crawler-targets__add-btn:hover {
    opacity: 0.9;
  }

  .crawler-targets__loading,
  .crawler-targets__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-3);
    padding: var(--spacing-12);
    color: var(--text-muted);
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-primary);
  }

  .crawler-targets__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-primary);
    border-top-color: var(--color-brand-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .crawler-targets__grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .crawler-targets__card {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-5);
    transition: all 0.2s;
  }

  .crawler-targets__card--active {
    border-color: var(--color-brand-primary);
    box-shadow: 0 0 0 1px var(--color-brand-primary);
  }

  .crawler-targets__card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-3);
  }

  .crawler-targets__card-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
  }

  .crawler-targets__card-name {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  .crawler-targets__status {
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  .crawler-targets__status--enabled {
    background: var(--color-success-overlay);
    color: var(--color-success);
  }

  .crawler-targets__status--disabled {
    background: var(--color-error-overlay);
    color: var(--color-error);
  }

  .crawler-targets__status--active {
    background: var(--color-info-overlay);
    color: var(--color-info);
  }

  .crawler-targets__card-actions {
    display: flex;
    gap: var(--spacing-2);
    flex-wrap: wrap;
  }

  .crawler-targets__action-btn {
    padding: 4px 10px;
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: all 0.2s;
    background: transparent;
    color: var(--text-secondary);
  }

  .crawler-targets__action-btn:hover {
    background: var(--bg-hover);
  }

  .crawler-targets__action-btn--activate {
    background: var(--color-info-overlay);
    border-color: var(--color-info-border);
    color: var(--color-info-light);
  }

  .crawler-targets__action-btn--deactivate {
    background: var(--color-error-overlay);
    border-color: var(--color-error-border);
    color: var(--color-error-light);
  }

  .crawler-targets__action-btn--enable {
    background: var(--color-success-overlay);
    border-color: var(--color-success-border);
    color: var(--color-success-light);
  }

  .crawler-targets__action-btn--disable {
    background: var(--color-warning-overlay);
    border-color: var(--color-warning-border);
    color: var(--color-warning-light);
  }

  .crawler-targets__action-btn--edit {
    background: var(--color-info-overlay);
    border-color: var(--color-info-border);
    color: var(--color-info-light);
  }

  .crawler-targets__action-btn--delete {
    background: var(--color-error-overlay);
    border-color: var(--color-error-border);
    color: var(--color-error-light);
  }

  .crawler-targets__card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .crawler-targets__card-url {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-sm);
  }

  .crawler-targets__label {
    color: var(--text-muted);
  }

  .crawler-targets__card-url a {
    color: var(--color-brand-primary);
    text-decoration: none;
  }

  .crawler-targets__card-url a:hover {
    text-decoration: underline;
  }

  .crawler-targets__card-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .crawler-targets__card-meta {
    display: flex;
    gap: var(--spacing-4);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  /* Dialog */
  .crawler-targets__dialog-overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-heavy);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-4);
  }

  .crawler-targets__dialog {
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-6);
    max-width: 640px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }

  .crawler-targets__dialog-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-5);
  }

  .crawler-targets__form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .crawler-targets__form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .crawler-targets__form-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .crawler-targets__form-input,
  .crawler-targets__form-textarea {
    padding: var(--spacing-2) var(--spacing-3);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    outline: none;
    transition: border-color 0.2s;
  }

  .crawler-targets__form-input:focus,
  .crawler-targets__form-textarea:focus {
    border-color: var(--color-brand-primary);
  }

  .crawler-targets__form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-3);
  }

  .crawler-targets__form-subtitle {
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--text-primary);
    margin-top: var(--spacing-2);
    padding-top: var(--spacing-3);
    border-top: 1px solid var(--border-primary);
  }

  .crawler-targets__form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-3);
    margin-top: var(--spacing-4);
  }

  .crawler-targets__form-cancel,
  .crawler-targets__form-submit {
    padding: var(--spacing-2) var(--spacing-5);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all 0.2s;
  }

  .crawler-targets__form-cancel {
    background: transparent;
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);
  }

  .crawler-targets__form-cancel:hover {
    background: var(--bg-hover);
  }

  .crawler-targets__form-submit {
    background: var(--color-brand-primary);
    border: none;
    color: var(--text-inverse);
  }

  .crawler-targets__form-submit:hover:not(:disabled) {
    opacity: 0.9;
  }

  .crawler-targets__form-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
