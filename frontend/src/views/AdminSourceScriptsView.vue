<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-slate-100">源脚本管理</h1>
        <p class="mt-1 text-sm text-slate-400">管理自定义视频源插件脚本</p>
      </div>
      <div class="flex gap-2">
        <button
          class="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
          @click="loadTemplate"
        >
          获取模板
        </button>
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          @click="openEditor()"
        >
          新建脚本
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500"
      ></div>
    </div>

    <div
      v-else-if="scripts.length === 0"
      class="rounded-xl border border-white/[0.06] bg-white/[0.03] py-16 text-center"
    >
      <p class="text-slate-400">暂无源脚本，点击"新建脚本"开始</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="script in scripts"
        :key="script.id"
        class="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:border-white/10"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-slate-100">{{ script.name }}</span>
            <code class="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{{
              script.key
            }}</code>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                script.enabled
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-500/15 text-slate-400'
              "
            >
              {{ script.enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <p v-if="script.description" class="mt-1 truncate text-xs text-slate-500">
            {{ script.description }}
          </p>
          <div class="mt-2 flex gap-4 text-xs text-slate-500">
            <span>请求: {{ script.requestCount }}</span>
            <span>错误: {{ script.errorCount }}</span>
            <span v-if="script.lastUsedAt">最后使用: {{ formatTime(script.lastUsedAt) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
            @click="testScript(script)"
          >
            测试
          </button>
          <button
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
            @click="toggleScript(script)"
          >
            {{ script.enabled ? '禁用' : '启用' }}
          </button>
          <button
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
            @click="openEditor(script)"
          >
            编辑
          </button>
          <button
            class="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10"
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
          class="flex h-[90vh] w-[90vw] max-w-5xl flex-col rounded-2xl border border-white/10 bg-[#0f1520] shadow-2xl"
        >
          <div class="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <h2 class="text-lg font-semibold text-slate-100">
              {{ editingScript?.id ? '编辑脚本' : '新建脚本' }}
            </h2>
            <button class="text-slate-400 hover:text-white" @click="closeEditor">&times;</button>
          </div>

          <div class="flex flex-1 overflow-hidden">
            <div class="flex w-80 flex-col border-r border-white/[0.06] p-4">
              <div class="space-y-3">
                <div>
                  <label class="mb-1 block text-xs text-slate-400">脚本 Key</label>
                  <input
                    v-model="form.key"
                    class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    placeholder="my-source"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">名称</label>
                  <input
                    v-model="form.name"
                    class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    placeholder="My Source"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-slate-400">描述</label>
                  <input
                    v-model="form.description"
                    class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
                    placeholder="A custom source"
                  />
                </div>
              </div>

              <div
                class="mt-4 flex-1 overflow-auto rounded-lg border border-white/[0.06] bg-slate-900/50 p-3"
              >
                <h3 class="mb-2 text-xs font-medium text-slate-400">测试结果</h3>
                <div v-if="testResult">
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs"
                      :class="
                        testResult.ok
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/15 text-red-400'
                      "
                    >
                      {{ testResult.ok ? '成功' : '失败' }}
                    </span>
                    <span class="text-xs text-slate-500">{{ testResult.duration }}ms</span>
                  </div>
                  <pre
                    v-if="testResult.error"
                    class="mt-2 whitespace-pre-wrap break-all text-xs text-red-300"
                    >{{ testResult.error }}</pre
                  >
                  <pre
                    v-if="testResult.logs?.length"
                    class="mt-2 whitespace-pre-wrap break-all text-xs text-slate-400"
                    >{{ testResult.logs.join('\n') }}</pre
                  >
                  <pre
                    v-if="testResult.result"
                    class="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-300"
                    >{{ JSON.stringify(testResult.result, null, 2) }}</pre
                  >
                </div>
                <p v-else class="text-xs text-slate-500">点击"测试"按钮运行脚本</p>
              </div>

              <div class="mt-4 flex gap-2">
                <button
                  class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                  :disabled="saving || !form.key || !form.name || !form.code"
                  @click="saveScript"
                >
                  {{ saving ? '保存中...' : '保存' }}
                </button>
                <button
                  class="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                  :disabled="testing"
                  @click="runTest"
                >
                  {{ testing ? '测试中...' : '测试' }}
                </button>
              </div>
            </div>

            <div class="flex flex-1 flex-col">
              <div class="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
                <span class="text-xs text-slate-400">代码编辑器</span>
                <button
                  class="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/5"
                  @click="form.code = template"
                >
                  插入模板
                </button>
              </div>
              <textarea
                v-model="form.code"
                class="flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-slate-200 outline-none"
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
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.2s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
</style>
