<template>
  <div class="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
    <div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_460px] lg:items-center">
      <section class="space-y-6">
        <span class="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200">
          创建 Nest TV 账号
        </span>
        <div>
          <h1 class="text-4xl font-bold leading-tight text-white">注册后开始沉淀你的专属观看与推荐体验</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            注册完成后，你的收藏、搜索历史、偏好设置与推荐画像都会围绕这个账号持续积累，方便后续跨会话继续使用。
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div class="text-xs text-slate-400">同步记录</div>
            <div class="mt-2 text-sm text-slate-100">搜索历史、收藏反馈、推荐偏好都会进入同一个账号上下文。</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div class="text-xs text-slate-400">后续可配置</div>
            <div class="mt-2 text-sm text-slate-100">注册后可继续维护昵称、头像、推荐偏好和密码安全。</div>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/40">
        <div>
          <h2 class="text-3xl font-bold">注册账号</h2>
          <p class="mt-2 text-sm text-slate-500">创建你的账号，开始完整使用 Nest TV。</p>
        </div>

        <InlineNotice
          v-if="notice"
          class="mt-6"
          :type="notice.type"
          :message="notice.message"
          dismissible
          @dismiss="notice = null"
        />

        <form class="mt-6 space-y-5" @submit.prevent="handleRegister">
          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">用户名</span>
            <input
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="请输入用户名"
            />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">邮箱</span>
            <input
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="请输入邮箱"
            />
          </label>

          <div class="grid gap-5 md:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-slate-700">密码</span>
              <input
                v-model="form.password"
                type="password"
                required
                minlength="6"
                autocomplete="new-password"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="至少 6 位"
              />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-slate-700">确认密码</span>
              <input
                v-model="form.confirmPassword"
                type="password"
                required
                autocomplete="new-password"
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="再次输入密码"
              />
            </label>
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading || success"
            class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ authStore.isLoading ? '注册中...' : success ? '即将跳转...' : '注册' }}
          </button>
        </form>

        <div class="mt-6 text-sm text-slate-500">
          已有账号？
          <router-link to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">立即登录</router-link>
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
