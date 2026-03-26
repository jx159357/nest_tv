<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
        <p class="mt-2 text-gray-600">查看系统用户、角色和账户状态</p>
      </div>
      <div class="flex gap-3">
        <input
          v-model="search"
          type="text"
          class="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="搜索用户名 / 邮箱 / 昵称"
          @keyup.enter="loadUsers(1)"
        />
        <button
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="loadUsers(1)"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="rounded-lg bg-white shadow">
      <div v-if="loading" class="p-8 text-center text-gray-500">加载中...</div>
      <div v-else-if="error" class="p-8 text-center text-red-600">{{ error }}</div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  用户
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  邮箱
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  角色
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  状态
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  最后登录
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  注册时间
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="item in users" :key="item.id">
                <td class="px-4 py-3 text-sm text-gray-900">
                  <div class="font-medium">{{ item.nickname || item.username }}</div>
                  <div class="text-xs text-gray-500">@{{ item.username }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.email }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ item.role }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'rounded-full px-2 py-1 text-xs font-medium',
                      item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                    ]"
                  >
                    {{ item.isActive ? '启用' : '停用' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.lastLoginAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(item.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600"
        >
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3">
            <button
              :disabled="page <= 1"
              class="rounded border px-3 py-1 disabled:opacity-50"
              @click="loadUsers(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded border px-3 py-1 disabled:opacity-50"
              @click="loadUsers(page + 1)"
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
  import { onMounted, ref } from 'vue';
  import { adminApi } from '@/api/admin';
  import type { User } from '@/types/user';

  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const search = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const loadUsers = async (nextPage = page.value) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await adminApi.getUsers({
        page: nextPage,
        limit: 10,
        search: search.value || undefined,
      });

      users.value = response.data;
      page.value = response.page;
      total.value = response.total;
      totalPages.value = Math.max(response.totalPages, 1);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : '加载用户列表失败';
    } finally {
      loading.value = false;
    }
  };

  const formatDate = (value?: Date | string | null) => {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString('zh-CN');
  };

  onMounted(() => {
    void loadUsers();
  });
</script>
