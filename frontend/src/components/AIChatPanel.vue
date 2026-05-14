<template>
  <div v-if="visible" class="ai-overlay" @click.self="$emit('close')">
    <div class="ai-panel">
      <div class="ai-header">
        <div class="ai-header-left">
          <span class="ai-icon">AI</span>
          <span class="ai-header-title">智能推荐</span>
        </div>
        <button class="ai-close" @click="$emit('close')">&times;</button>
      </div>

      <div ref="messagesRef" class="ai-messages">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['ai-msg', `ai-msg--${msg.role}`]"
        >
          <div class="ai-msg-avatar">
            {{ msg.role === 'user' ? 'U' : 'AI' }}
          </div>
          <div class="ai-msg-body">
            <div class="ai-msg-text" v-html="renderMarkdown(msg.content)"></div>
          </div>
        </div>

        <div v-if="streaming" class="ai-msg ai-msg--assistant">
          <div class="ai-msg-avatar">AI</div>
          <div class="ai-msg-body">
            <div class="ai-msg-text ai-typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div v-if="messages.length === 0" class="ai-welcome">
          <p class="ai-welcome-title">你好！我是 AI 影视推荐助手</p>
          <p class="ai-welcome-desc">可以问我任何影视相关的问题</p>
          <div class="ai-suggestions">
            <button
              v-for="s in suggestions"
              :key="s"
              class="ai-suggestion"
              @click="sendMessage(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </div>

      <div class="ai-input-area">
        <textarea
          v-model="input"
          class="ai-input"
          :placeholder="streaming ? 'AI 正在回复...' : '输入你的问题...'"
          :disabled="streaming"
          rows="1"
          @keydown.enter.exact.prevent="handleSend"
          @input="autoResize"
        ></textarea>
        <button
          class="ai-send"
          :disabled="!input.trim() || streaming"
          @click="handleSend"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import axios from 'axios';

interface Props {
  visible: boolean;
  context?: {
    title?: string;
    year?: string;
    type?: string;
    genres?: string[];
    rating?: number;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const props = defineProps<Props>();
defineEmits<{ close: [] }>();

const input = ref('');
const messages = ref<ChatMessage[]>([]);
const streaming = ref(false);
const messagesRef = ref<HTMLElement>();

const suggestions = [
  '推荐几部高分电影',
  '有什么好看的悬疑剧',
  '最近有什么新片推荐',
];

const SESSION_KEY = 'nest_tv_ai_chat';

const loadHistory = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) messages.value = JSON.parse(raw);
  } catch {}
};

const saveHistory = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages.value));
  } catch {}
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
};

const renderMarkdown = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};

const autoResize = (e: Event) => {
  const el = e.target as HTMLTextAreaElement;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
};

const handleSend = () => {
  const text = input.value.trim();
  if (!text || streaming.value) return;
  sendMessage(text);
};

const sendMessage = async (text: string) => {
  input.value = '';
  messages.value.push({ role: 'user', content: text });
  saveHistory();
  await scrollToBottom();

  streaming.value = true;
  messages.value.push({ role: 'assistant', content: '' });

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        message: text,
        context: props.context,
        history: messages.value.slice(0, -1).slice(-10),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            messages.value[messages.value.length - 1].content += `\n\n错误: ${parsed.error}`;
          } else if (parsed.text) {
            messages.value[messages.value.length - 1].content += parsed.text;
          }
          await scrollToBottom();
        } catch {}
      }
    }

    saveHistory();
  } catch (err) {
    const last = messages.value[messages.value.length - 1];
    if (last && last.role === 'assistant') {
      last.content = last.content || `请求失败: ${err instanceof Error ? err.message : '未知错误'}`;
    }
    saveHistory();
  } finally {
    streaming.value = false;
    await scrollToBottom();
  }
};

watch(() => props.visible, (v) => {
  if (v) loadHistory();
});
</script>

<style scoped>
.ai-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.ai-panel {
  width: 90vw;
  max-width: 520px;
  height: 80vh;
  max-height: 680px;
  background: #0f1520;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.ai-header-title {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
}

.ai-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}

.ai-close:hover {
  color: #e2e8f0;
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-messages::-webkit-scrollbar {
  width: 4px;
}

.ai-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.ai-msg {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.ai-msg--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-msg--assistant {
  align-self: flex-start;
}

.ai-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.ai-msg--user .ai-msg-avatar {
  background: #3b82f6;
  color: white;
}

.ai-msg--assistant .ai-msg-avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.ai-msg-body {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.ai-msg--user .ai-msg-body {
  background: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-msg--assistant .ai-msg-body {
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  border-bottom-left-radius: 4px;
}

.ai-msg-text :deep(strong) {
  font-weight: 600;
  color: #a5b4fc;
}

.ai-msg-text :deep(code) {
  background: rgba(99, 102, 241, 0.2);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.ai-typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.ai-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  animation: ai-bounce 1.4s ease-in-out infinite;
}

.ai-typing span:nth-child(2) { animation-delay: 0.2s; }
.ai-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes ai-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.ai-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.ai-welcome-title {
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
}

.ai-welcome-desc {
  font-size: 14px;
  color: #64748b;
}

.ai-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.ai-suggestion {
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 20px;
  color: #a5b4fc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-suggestion:hover {
  background: rgba(99, 102, 241, 0.2);
}

.ai-input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.ai-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 14px;
  color: #e2e8f0;
  font-size: 14px;
  resize: none;
  outline: none;
  min-height: 40px;
  max-height: 120px;
  font-family: inherit;
}

.ai-input:focus {
  border-color: #6366f1;
}

.ai-input:disabled {
  opacity: 0.5;
}

.ai-send {
  width: 40px;
  height: 40px;
  background: #6366f1;
  border: none;
  border-radius: 10px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.ai-send:hover:not(:disabled) {
  background: #4f46e5;
}

.ai-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .ai-panel {
    width: 100vw;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }
}
</style>
