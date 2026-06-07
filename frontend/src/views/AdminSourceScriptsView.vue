<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="src-title text-xl font-semibold">源脚本管理</h1>
        <p class="src-subtitle mt-1 text-sm">管理自定义视频源插件脚本</p>
      </div>
      <div class="flex gap-2">
        <button
          class="src-btn-ghost rounded-lg border px-4 py-2 text-sm transition"
          @click="loadTemplate"
        >
          获取模板
        </button>
        <button
          class="src-btn-primary rounded-lg px-4 py-2 text-sm font-medium transition"
          @click="openEditor()"
        >
          新建脚本
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="src-spinner h-8 w-8 animate-spin rounded-full border-2"></div>
    </div>

    <div
      v-else-if="scripts.length === 0"
      class="src-empty-card rounded-xl border py-16 text-center"
    >
      <p class="src-text-muted">暂无源脚本，点击"新建脚本"开始</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="script in scripts"
        :key="script.id"
        class="src-card flex items-center justify-between rounded-xl border p-4 transition"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <span class="src-text-primary text-sm font-medium">{{ script.name }}</span>
            <code class="src-code rounded px-2 py-0.5 text-xs">{{ script.key }}</code>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="script.enabled ? 'src-badge-success' : 'src-badge-muted'"
            >
              {{ script.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <p v-if="script.description" class="src-text-tertiary mt-1 truncate text-xs">
            {{ script.description }}
          </p>
          <div class="src-text-tertiary mt-2 flex gap-4 text-xs">
            <span>请求: {{ script.requestCount }}</span>
            <span>错误: {{ script.errorCount }}</span>
            <span v-if="script.lastUsedAt">最后使用: {{ formatTime(script.lastUsedAt) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="src-btn-ghost rounded-lg border px-3 py-1.5 text-xs transition"
            @click="testScript(script)"
          >
            测试
          </button>
          <button
            class="src-btn-ghost rounded-lg border px-3 py-1.5 text-xs transition"
            @click="toggleScript(script)"
          >
            {{ script.enabled ? '禁用' : '启用' }}
          </button>
          <button
            class="src-btn-ghost rounded-lg border px-3 py-1.5 text-xs transition"
            @click="openEditor(script)"
          >
            编辑
          </button>
          <button
            class="src-btn-danger rounded-lg border px-3 py-1.5 text-xs transition"
            @click="deleteScript(script)"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div
        v-if="showEditor"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="closeEditor"
      >
        <div
          class="src-modal flex h-[90vh] w-[90vw] max-w-5xl flex-col rounded-2xl border shadow-2xl"
        >
          <div class="src-border-subtle flex items-center justify-between border-b px-6 py-4">
            <h2 class="src-text-primary text-lg font-semibold">
              {{ editingScript?.id ? '编辑脚本' : '新建脚本' }}
            </h2>
            <button class="src-close-btn" @click="closeEditor">&times;</button>
          </div>

          <div class="flex flex-1 overflow-hidden">
            <div class="src-border-subtle flex w-80 flex-col border-r p-4">
              <div class="space-y-3">
                <div>
                  <label class="src-text-muted mb-1 block text-xs">脚本 Key</label>
                  <input
                    v-model="form.key"
                    class="src-input w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    placeholder="my-source"
                  />
                </div>
                <div>
                  <label class="src-text-muted mb-1 block text-xs">名称</label>
                  <input
                    v-model="form.name"
                    class="src-input w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    placeholder="My Source"
                  />
                </div>
                <div>
                  <label class="src-text-muted mb-1 block text-xs">描述</label>
                  <input
                    v-model="form.description"
                    class="src-input w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    placeholder="A custom source"
                  />
                </div>
              </div>

              <div class="src-test-panel mt-4 flex-1 overflow-auto rounded-lg border p-3">
                <h3 class="src-text-muted mb-2 text-xs font-medium">测试结果</h3>
                <div v-if="testResult">
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs"
                      :class="testResult.ok ? 'src-badge-success' : 'src-badge-error'"
                    >
                      {{ testResult.ok ? '成功' : '失败' }}
                    </span>
                    <span class="src-text-tertiary text-xs">{{ testResult.duration }}ms</span>
                  </div>
                  <pre
                    v-if="testResult.error"
                    class="src-text-error mt-2 whitespace-pre-wrap break-all text-xs"
                    >{{ testResult.error }}</pre
                  >
                  <pre
                    v-if="testResult.logs?.length"
                    class="src-text-muted mt-2 whitespace-pre-wrap break-all text-xs"
                    >{{ testResult.logs.join('\n') }}</pre
                  >
                  <pre
                    v-if="testResult.result"
                    class="src-text-secondary mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs"
                    >{{ JSON.stringify(testResult.result, null, 2) }}</pre
                  >
                </div>
                <p v-else class="src-text-tertiary text-xs">点击"测试"按钮运行脚本</p>
              </div>

              <div class="mt-4 flex gap-2">
                <button
                  class="src-btn-primary flex-1 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
                  :disabled="saving || !form.key || !form.name || !form.code"
                  @click="saveScript"
                >
                  {{ saving ? '保存中...' : '保存' }}
                </button>
                <button
                  class="src-btn-ghost rounded-lg border px-4 py-2 text-sm transition disabled:opacity-50"
                  :disabled="testing"
                  @click="runTest"
                >
                  {{ testing ? '测试中...' : '测试' }}
                </button>
              </div>
            </div>

            <div class="flex flex-1 flex-col">
              <div class="src-border-subtle flex items-center justify-between border-b px-4 py-2">
                <span class="src-text-muted text-xs">代码编辑器</span>
                <button
                  class="src-action-btn rounded px-2 py-1 text-xs"
                  @click="form.code = template"
                >
                  插入模板
                </button>
              </div>
              <textarea
                v-model="form.code"
                class="src-textarea flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
                spellcheck="false"
                placeholder="// Write your script here..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import axios from 'axios';

  interface ScriptRecord {
    id: number;
    key: string;
    name: string;
    code: string;
    description?: string;
    enabled: boolean;
    config?: Record<string, string> | null;
    requestCount: number;
    errorCount: number;
    lastUsedAt?: string;
    version?: string;
  }

  interface TestResult {
    ok: boolean;
    duration: number;
    logs: string[];
    meta?: unknown;
    result?: unknown;
    error?: string;
  }

  const loading = ref(true);
  const saving = ref(false);
  const testing = ref(false);
  const scripts = ref<ScriptRecord[]>([]);
  const showEditor = ref(false);
  const editingScript = ref<ScriptRecord | null>(null);
  const testResult = ref<TestResult | null>(null);
  const template = ref('');

  const form = ref({
    key: '',
    name: '',
    code: '',
    description: '',
    config: null as Record<string, string> | null,
  });

  const loadScripts = async () => {
    loading.value = true;
    try {
      const { data } = await axios.get<ScriptRecord[]>('/api/source-scripts');
      scripts.value = data;
    } catch {
      // ignore
    } finally {
      loading.value = false;
    }
  };

  const loadTemplate = async () => {
    try {
      const { data } = await axios.get<{ template: string }>('/api/source-scripts/template');
      template.value = data.template;
      form.value.code = data.template;
    } catch {
      // ignore
    }
  };

  const openEditor = (script?: ScriptRecord) => {
    if (script) {
      editingScript.value = script;
      form.value = {
        key: script.key,
        name: script.name,
        code: script.code,
        description: script.description || '',
        config: script.config || null,
      };
    } else {
      editingScript.value = null;
      form.value = { key: '', name: '', code: template.value, description: '', config: null };
    }
    testResult.value = null;
    showEditor.value = true;
  };

  const closeEditor = () => {
    showEditor.value = false;
    editingScript.value = null;
    testResult.value = null;
  };

  const saveScript = async () => {
    saving.value = true;
    try {
      await axios.post('/api/source-scripts', {
        id: editingScript.value?.id,
        key: form.value.key,
        name: form.value.name,
        code: form.value.code,
        description: form.value.description || undefined,
        config: form.value.config || undefined,
      });
      closeEditor();
      await loadScripts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      alert(msg);
    } finally {
      saving.value = false;
    }
  };

  const runTest = async () => {
    testing.value = true;
    testResult.value = null;
    try {
      const { data } = await axios.post<TestResult>('/api/source-scripts/test', {
        code: form.value.code,
        config: form.value.config || undefined,
      });
      testResult.value = data;
    } catch (err: unknown) {
      testResult.value = {
        ok: false,
        duration: 0,
        logs: [],
        error: err instanceof Error ? err.message : 'Test failed',
      };
    } finally {
      testing.value = false;
    }
  };

  const testScript = async (script: ScriptRecord) => {
    openEditor(script);
    await runTest();
  };

  const toggleScript = async (script: ScriptRecord) => {
    try {
      await axios.post(`/api/source-scripts/${script.id}/toggle`);
      await loadScripts();
    } catch {
      // ignore
    }
  };

  const deleteScript = async (script: ScriptRecord) => {
    if (!confirm(`确定删除脚本 "${script.name}"?`)) return;
    try {
      await axios.delete(`/api/source-scripts/${script.id}`);
      await loadScripts();
    } catch {
      // ignore
    }
  };

  const formatTime = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('zh-CN');
  };

  onMounted(() => {
    loadScripts();
    loadTemplate();
  });
</script>

<style scoped>
  /* ===== 文本色 ===== */
  .src-title {
    color: var(--text-primary);
  }

  .src-subtitle {
    color: var(--text-muted);
  }

  .src-text-primary {
    color: var(--text-primary);
  }

  .src-text-secondary {
    color: var(--text-secondary);
  }

  .src-text-muted {
    color: var(--text-muted);
  }

  .src-text-tertiary {
    color: var(--text-tertiary);
  }

  .src-text-error {
    color: var(--color-error-light);
  }

  .src-close-btn {
    color: var(--text-muted);
    cursor: pointer;
    background: none;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    transition: color var(--transition-fast);
  }

  .src-close-btn:hover {
    color: var(--text-primary);
  }

  /* ===== 背景色 ===== */
  .src-empty-card {
    border-color: var(--border-primary);
    background-color: var(--bg-tertiary);
  }

  .src-card {
    border-color: var(--border-primary);
    background-color: var(--bg-tertiary);
  }

  .src-card:hover {
    border-color: var(--border-secondary);
  }

  .src-code {
    background-color: var(--color-gray-800);
    color: var(--text-muted);
  }

  .src-modal {
    border-color: var(--border-secondary);
    background-color: var(--bg-card);
  }

  .src-test-panel {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
  }

  /* ===== 按钮 ===== */
  .src-btn-primary {
    background-color: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .src-btn-primary:hover {
    background-color: var(--color-brand-primary-light);
  }

  .src-btn-ghost {
    border-color: var(--border-secondary);
    color: var(--text-muted);
  }

  .src-btn-ghost:hover {
    background-color: var(--bg-secondary);
  }

  .src-btn-danger {
    border-color: var(--color-error);
    color: var(--color-error-light);
  }

  .src-btn-danger:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  /* ===== 表单输入 ===== */
  .src-input {
    border-color: var(--border-secondary);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  .src-input:focus {
    border-color: var(--border-focus);
  }

  /* ===== 徽章 ===== */
  .src-badge-success {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }

  .src-badge-error {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--color-error-light);
  }

  .src-badge-muted {
    background-color: rgba(100, 116, 139, 0.15);
    color: var(--text-muted);
  }

  /* ===== 加载指示器 ===== */
  .src-spinner {
    border-color: var(--color-gray-600);
    border-top-color: var(--color-brand-primary);
  }

  /* ===== 边框 ===== */
  .src-border-subtle {
    border-color: var(--border-primary);
  }

  /* ===== 操作按钮 ===== */
  .src-action-btn {
    color: var(--text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .src-action-btn:hover {
    background-color: var(--bg-secondary);
  }

  /* ===== 文本域 ===== */
  .src-textarea {
    color: var(--text-secondary);
  }

  /* ===== 模态框动画 ===== */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
</style>
