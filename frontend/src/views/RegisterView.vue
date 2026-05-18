<template>
  <div class="register-page">
    <div class="register-grid">
      <section class="register-hero">
        <span class="register-badge">创建 Nest TV 账号</span>
        <div>
          <h1 class="register-hero-title">
            注册后开始沉淀你的专属观看与推荐体验
          </h1>
          <p class="register-hero-desc">
            注册完成后，你的收藏、搜索历史、偏好设置与推荐画像都会围绕这个账号持续积累，方便后续跨会话继续使用。
          </p>
        </div>
        <div class="register-features">
          <div class="register-feature-card">
            <div class="register-feature-label">同步记录</div>
            <div class="register-feature-text">
              搜索历史、收藏反馈、推荐偏好都会进入同一个账号上下文。
            </div>
          </div>
          <div class="register-feature-card">
            <div class="register-feature-label">后续可配置</div>
            <div class="register-feature-text">
              注册后可继续维护昵称、头像、推荐偏好和密码安全。
            </div>
          </div>
        </div>
      </section>

      <section class="register-card">
        <div>
          <h2 class="register-card-title">注册账号</h2>
          <p class="register-card-desc">创建你的账号，开始完整使用 Nest TV。</p>
        </div>

        <InlineNotice
          v-if="notice"
          class="register-notice"
          :type="notice.type"
          :message="notice.message"
          dismissible
          @dismiss="notice = null"
        />

        <form class="register-form" @submit.prevent="handleRegister">
          <label class="register-field">
            <span class="register-label">用户名</span>
            <input
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              class="register-input"
              placeholder="请输入用户名"
            />
          </label>

          <label class="register-field">
            <span class="register-label">邮箱</span>
            <input
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="register-input"
              placeholder="请输入邮箱"
            />
          </label>

          <div class="register-password-row">
            <label class="register-field">
              <span class="register-label">密码</span>
              <input
                v-model="form.password"
                type="password"
                required
                minlength="6"
                autocomplete="new-password"
                class="register-input"
                placeholder="至少 6 位"
              />
            </label>

            <label class="register-field">
              <span class="register-label">确认密码</span>
              <input
                v-model="form.confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                class="register-input"
                placeholder="再次输入密码"
              />
            </label>
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading || success"
            class="register-submit"
          >
            {{ authStore.isLoading ? '注册中...' : success ? '即将跳转...' : '注册' }}
          </button>
        </form>

        <div class="register-footer">
          已有账号？
          <router-link to="/login" class="register-link">立即登录</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import InlineNotice from '@/components/InlineNotice.vue';
  import { useAuthStore } from '@/stores/auth';

  const router = useRouter();
  const authStore = useAuthStore();

  const form = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const success = ref(false);
  const notice = ref<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleRegister = async () => {
    notice.value = null;

    if (form.value.password !== form.value.confirmPassword) {
      notice.value = {
        type: 'error',
        message: '两次输入的密码不一致',
      };
      return;
    }

    const result = await authStore.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
    });

    if (result.success) {
      success.value = true;
      notice.value = {
        type: 'success',
        message: '注册成功，正在跳转到登录页面...',
      };
      window.setTimeout(() => {
        void router.push('/login');
      }, 1200);
      return;
    }

    notice.value = {
      type: 'error',
      message: result.error,
    };
  };
</script>

<style scoped>
  .register-page {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
    padding: 48px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .register-grid {
    display: grid;
    width: 100%;
    max-width: 1100px;
    gap: 40px;
    align-items: center;
  }

  @media (min-width: 1024px) {
    .register-grid {
      grid-template-columns: 1.05fr 460px;
    }
  }

  .register-hero {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .register-badge {
    display: inline-flex;
    align-self: flex-start;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.08);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--color-success-light);
  }

  .register-hero-title {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-primary);
  }

  .register-hero-desc {
    margin-top: 16px;
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-secondary);
    max-width: 560px;
  }

  .register-features {
    display: grid;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .register-features {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .register-feature-card {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid var(--border-primary);
    background: var(--bg-card);
  }

  .register-feature-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .register-feature-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .register-card {
    background: var(--bg-card);
    border-radius: 24px;
    border: 1px solid var(--border-primary);
    padding: 32px;
    box-shadow: var(--shadow-xl);
  }

  .register-card-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .register-card-desc {
    margin-top: 8px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .register-notice {
    margin-top: 24px;
  }

  .register-form {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .register-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .register-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .register-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid var(--border-secondary);
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
  }

  .register-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  .register-input::placeholder {
    color: var(--text-muted);
  }

  .register-password-row {
    display: grid;
    gap: 20px;
  }

  @media (min-width: 768px) {
    .register-password-row {
      grid-template-columns: 1fr 1fr;
    }
  }

  .register-submit {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-primary-dark));
    color: white;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .register-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
  }

  .register-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .register-footer {
    margin-top: 24px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .register-link {
    font-weight: 500;
    color: var(--color-brand-primary);
    text-decoration: none;
  }

  .register-link:hover {
    color: var(--color-brand-primary-light);
  }
</style>
