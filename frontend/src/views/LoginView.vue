<template>
  <div class="login-page">
    <div class="login-grid">
      <section class="login-hero">
        <span class="login-badge">Nest TV 账号中心</span>
        <div>
          <h1 class="login-hero-title">
            登录后继续你的收藏、搜索与推荐链路
          </h1>
          <p class="login-hero-desc">
            使用账号登录后，可同步搜索历史、收藏反馈、推荐画像和个人偏好设置，让体验在多次访问间保持连续。
          </p>
        </div>
        <div class="login-features">
          <div class="login-feature-card">
            <div class="login-feature-label">同步收藏</div>
            <div class="login-feature-text">
              收藏结果即时反馈，并可回到高亮定位的收藏页。
            </div>
          </div>
          <div class="login-feature-card">
            <div class="login-feature-label">搜索画像</div>
            <div class="login-feature-text">
              登录后搜索会沉淀到服务端历史，并参与推荐生成。
            </div>
          </div>
          <div class="login-feature-card">
            <div class="login-feature-label">偏好设置</div>
            <div class="login-feature-text">
              登录后可维护资料、推荐偏好和密码安全信息。
            </div>
          </div>
        </div>
      </section>

      <section class="login-card">
        <div>
          <h2 class="login-card-title">登录到 Nest TV</h2>
          <p class="login-card-desc">请输入用户名或邮箱与密码。</p>
        </div>

        <InlineNotice
          v-if="notice"
          class="login-notice"
          :type="notice.type"
          :message="notice.message"
          dismissible
          @dismiss="notice = null"
        />

        <form class="login-form" @submit.prevent="handleLogin">
          <label class="login-field">
            <span class="login-label">用户名或邮箱</span>
            <input
              v-model="form.identifier"
              type="text"
              required
              autocomplete="username"
              class="login-input"
              placeholder="请输入用户名或邮箱"
            />
          </label>

          <label class="login-field">
            <span class="login-label">密码</span>
            <input
              v-model="form.password"
              type="password"
              required
              autocomplete="current-password"
              class="login-input"
              placeholder="请输入密码"
            />
          </label>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="login-submit"
          >
            {{ authStore.isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="login-footer">
          还没有账号？
          <router-link to="/register" class="login-link">立即注册</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import InlineNotice from '@/components/InlineNotice.vue';
  import { useAuthStore } from '@/stores/auth';

  const route = useRoute();
  const router = useRouter();
  const authStore = useAuthStore();

  const form = ref({
    identifier: '',
    password: '',
  });

  const notice = ref<{ type: 'error' | 'info'; message: string } | null>(null);

  const handleLogin = async () => {
    notice.value = null;

    const result = await authStore.login({
      identifier: form.value.identifier,
      password: form.value.password,
    });

    if (result.success) {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
      void router.push(redirect);
      return;
    }

    notice.value = {
      type: 'error',
      message: result.error,
    };
  };
</script>

<style scoped>
  .login-page {
    min-height: 100vh;
    background:
      linear-gradient(180deg, rgba(229, 9, 20, 0.12), transparent 32%),
      var(--bg-page);
    color: var(--text-primary);
    padding: 48px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-grid {
    display: grid;
    width: 100%;
    max-width: 1100px;
    gap: 32px;
    align-items: center;
  }

  @media (min-width: 1024px) {
    .login-grid {
      grid-template-columns: 1.1fr 440px;
    }
  }

  .login-hero {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .login-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 4px 12px;
    border-radius: 8px;
    border: 1px solid var(--color-brand-border);
    background: var(--color-brand-overlay);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--color-brand-primary-light);
  }

  .login-hero-title {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-primary);
  }

  .login-hero-desc {
    margin-top: 16px;
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-secondary);
    max-width: 560px;
  }

  .login-features {
    display: grid;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .login-features {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .login-feature-card {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--border-primary);
    background: rgba(255, 255, 255, 0.035);
  }

  .login-feature-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .login-feature-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .login-card {
    background: var(--bg-card);
    border-radius: 12px;
    border: 1px solid var(--border-primary);
    padding: 32px;
    box-shadow: var(--shadow-xl);
  }

  .login-card-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .login-card-desc {
    margin-top: 8px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .login-notice {
    margin-top: 24px;
  }

  .login-form {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .login-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .login-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .login-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }

  .login-input:focus {
    border-color: var(--border-focus);
    box-shadow: var(--shadow-focus);
  }

  .login-input::placeholder {
    color: var(--text-muted);
  }

  .login-submit {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-primary-dark));
    color: white;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px var(--color-brand-glow);
  }

  .login-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .login-footer {
    margin-top: 24px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .login-link {
    font-weight: 500;
    color: var(--color-brand-primary);
    text-decoration: none;
  }

  .login-link:hover {
    color: var(--color-brand-primary-light);
  }

  @media (max-width: 767px) {
    .login-page {
      align-items: flex-start;
      padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
    }

    .login-grid {
      gap: 18px;
    }

    .login-hero {
      gap: 12px;
    }

    .login-hero-title {
      font-size: 24px;
      line-height: 1.25;
    }

    .login-hero-desc {
      margin-top: 10px;
      font-size: 13px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .login-features {
      display: none;
    }

    .login-card {
      padding: 20px;
      box-shadow: var(--shadow-lg);
    }

    .login-card-title {
      font-size: 22px;
    }

    .login-form {
      margin-top: 20px;
      gap: 16px;
    }

    .login-input {
      min-height: 46px;
      font-size: 16px;
    }

    .login-submit {
      min-height: 46px;
      font-size: 15px;
    }
  }
</style>
