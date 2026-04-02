<template>
  <div class="min-h-screen bg-slate-950 px-4 py-12 text-slate-50">
    <div class="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_440px] lg:items-center">
      <section class="space-y-6">
        <span class="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium tracking-wide text-indigo-200">
          Nest TV 账号中心
        </span>
        <div>
          <h1 class="text-4xl font-bold leading-tight text-white">登录后继续你的收藏、搜索与推荐链路</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            使用账号登录后，可同步搜索历史、收藏反馈、推荐画像和个人偏好设置，让体验在多次访问间保持连续。
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div class="text-xs text-slate-400">同步收藏</div>
            <div class="mt-2 text-sm text-slate-100">收藏结果即时反馈，并可回到高亮定位的收藏页。</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div class="text-xs text-slate-400">搜索画像</div>
            <div class="mt-2 text-sm text-slate-100">登录后搜索会沉淀到服务端历史，并参与推荐生成。</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div class="text-xs text-slate-400">偏好设置</div>
            <div class="mt-2 text-sm text-slate-100">登录后可维护资料、推荐偏好和密码安全信息。</div>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/40">
        <div>
          <h2 class="text-3xl font-bold">登录到 Nest TV</h2>
          <p class="mt-2 text-sm text-slate-500">请输入用户名或邮箱与密码。</p>
        </div>

        <InlineNotice
          v-if="notice"
          class="mt-6"
          :type="notice.type"
          :message="notice.message"
          dismissible
          @dismiss="notice = null"
        />

        <form class="mt-6 space-y-5" @submit.prevent="handleLogin">
          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">用户名或邮箱</span>
            <input
              v-model="form.identifier"
              type="text"
              required
              autocomplete="username"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="请输入用户名或邮箱"
            />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-700">密码</span>
            <input
              v-model="form.password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="请输入密码"
            />
          </label>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ authStore.isLoading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="mt-6 text-sm text-slate-500">
          还没有账号？
          <router-link to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">立即注册</router-link>
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
