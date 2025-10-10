<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">注册账号</h2>
        <p class="mt-2 text-gray-600">创建您的新账号</p>
      </div>

      <form class="space-y-6" @submit.prevent="handleRegister">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700"> 用户名 </label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"> 邮箱 </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请输入邮箱"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"> 密码 </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请输入密码（至少6位）"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
            确认密码
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="请再次输入密码"
          />
        </div>

        <div v-if="error" class="text-red-600 text-sm">
          {{ error }}
        </div>

        <div v-if="success" class="text-green-600 text-sm">注册成功！正在跳转到登录页面...</div>

        <div>
          <button
            type="submit"
            :disabled="authStore.isLoading || success"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ authStore.isLoading ? '注册中...' : '注册' }}
          </button>
        </div>
      </form>

      <div class="text-center">
        <p class="text-sm text-gray-600">
          已有账号？
          <router-link to="/login" class="text-indigo-600 hover:text-indigo-500">
            立即登录
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/stores/auth';

  const router = useRouter();
  const authStore = useAuthStore();

  const form = ref({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const error = ref('');
  const success = ref(false);

  const handleRegister = async () => {
    error.value = '';

    // 验证密码确认
    if (form.value.password !== form.value.confirmPassword) {
      error.value = '两次输入的密码不一致';
      return;
    }

    const result = await authStore.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password,
    });

    if (result.success) {
      success.value = true;
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      error.value = result.error;
    }
  };
</script>
