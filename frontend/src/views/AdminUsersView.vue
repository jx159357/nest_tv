<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-100">用户管理</h1>
        <p class="mt-2 text-slate-400">查看系统用户、角色和账户状态</p>
      </div>
      <div class="flex gap-3">
        <input
          v-model="search"
          type="text"
          class="w-64 rounded-lg border border-slate-700 bg-white/[0.05] px-3 py-2 text-sm text-slate-200 placeholder-slate-500"
          placeholder="搜索用户名 / 邮箱 / 昵称"
          @keyup.enter="applyFilters(1)"
        />
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          @click="applyFilters(1)"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="rounded-lg border border-white/[0.06] bg-white/[0.03] shadow-xl">
      <div v-if="loading" class="p-8 text-center text-slate-400">加载中...</div>
      <div v-else-if="error" class="p-8 text-center text-rose-400">{{ error }}</div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-white/[0.06]">
            <thead class="bg-white/[0.02]">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  用户
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  邮箱
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  角色
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  状态
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  最后登录
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  注册时间
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/[0.06]">
              <tr v-for="item in users" :key="item.id">
                <td class="px-4 py-3 text-sm text-slate-100">
                  <div class="font-medium">{{ item.nickname || item.username }}</div>
                  <div class="text-xs text-slate-500">@{{ item.username }}</div>
                  <router-link
                    :to="{ name: 'admin-download-tasks', query: { userId: String(item.id) } }"
                    class="mt-2 inline-flex text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    查看下载任务
                  </router-link>
                </td>
                <td class="px-4 py-3 text-sm text-slate-400">{{ item.email }}</td>
                <td class="px-4 py-3 text-sm text-slate-400">{{ item.role }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'rounded-full px-2 py-1 text-xs font-medium',
                      item.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400',
                    ]"
                  >
                    {{ item.isActive ? '启用' : '停用' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-400">{{ formatDate(item.lastLoginAt) }}</td>
                <td class="px-4 py-3 text-sm text-slate-400">{{ formatDate(item.createdAt) }}</td>
                <td class="px-4 py-3 text-sm">
                  <button
                    :class="[
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      item.isActive
                        ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
                        : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30',
                    ]"
                    @click="toggleUserStatus(item)"
                  >
                    {{ item.isActive ? '封禁' : '解封' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-sm text-slate-400"
        >
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3">
            <button
              :disabled="page <= 1"
              class="rounded border border-slate-700 px-3 py-1 text-slate-300 disabled:opacity-50"
              @click="applyFilters(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="rounded border border-slate-700 px-3 py-1 text-slate-300 disabled:opacity-50"
              @click="applyFilters(page + 1)"
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
  import { ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { adminApi } from '@/api/admin';
  import type { User } from '@/types/user';

  const route = useRoute();
  const router = useRouter();
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const search = ref('');
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const readSingleQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

  const syncFiltersFromRoute = () => {
    const queryPage = Number(readSingleQuery(route.query.page));
    const querySearch = readSingleQuery(route.query.search);

    page.value = Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1;
    search.value = typeof querySearch === 'string' ? querySearch : '';
  };

  const buildUsersQuery = (nextPage = 1) => {
    const query: Record<string, string> = {};

    if (nextPage > 1) {
      query.page = String(nextPage);
    }
    if (search.value.trim()) {
      query.search = search.value.trim();
    }

    return query;
  };

  const applyFilters = async (nextPage = 1) => {
    await router.replace({
      name: 'admin-users',
      query: buildUsersQuery(nextPage),
    });
  };

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
      if (response.page !== nextPage) {
        await router.replace({
          name: 'admin-users',
          query: buildUsersQuery(response.page),
        });
      }
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

  const toggleUserStatus = async (user: any) => {
    try {
      await adminApi.toggleUserStatus(user.id);
      user.isActive = !user.isActive;
    } catch (e: any) {
      error.value = e.message || '操作失败';
    }
  };

  watch(
    () => route.query,
    () => {
      syncFiltersFromRoute();
      void loadUsers(page.value);
    },
    { immediate: true },
  );
</script>
