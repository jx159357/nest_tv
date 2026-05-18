<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="page-title text-2xl font-bold">用户管理</h1>
        <p class="page-description mt-2">查看系统用户、角色和账户状态</p>
      </div>
      <div class="flex gap-3">
        <input
          v-model="search"
          type="text"
          class="search-input w-64 rounded-lg border px-3 py-2 text-sm"
          placeholder="搜索用户名 / 邮箱 / 昵称"
          @keyup.enter="applyFilters(1)"
        />
        <button
          class="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          @click="applyFilters(1)"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="content-card rounded-lg border shadow-xl">
      <div v-if="loading" class="text-muted p-8 text-center">加载中...</div>
      <div v-else-if="error" class="error-text p-8 text-center">{{ error }}</div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="table-divide min-w-full">
            <thead class="table-thead">
              <tr>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  用户
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  邮箱
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  角色
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  状态
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  最后登录
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  注册时间
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="table-divide">
              <tr v-for="item in users" :key="item.id">
                <td class="px-4 py-3 text-sm">
                  <div class="user-name font-medium">{{ item.nickname || item.username }}</div>
                  <div class="username-hint text-xs">@{{ item.username }}</div>
                  <router-link
                    :to="{ name: 'admin-download-tasks', query: { userId: String(item.id) } }"
                    class="download-link mt-2 inline-flex text-xs"
                  >
                    查看下载任务
                  </router-link>
                </td>
                <td class="cell-text px-4 py-3 text-sm">{{ item.email }}</td>
                <td class="cell-text px-4 py-3 text-sm">{{ item.role }}</td>
                <td class="px-4 py-3 text-sm">
                  <span
                    :class="[
                      'rounded-full px-2 py-1 text-xs font-medium',
                      item.isActive ? 'status-active' : 'status-inactive',
                    ]"
                  >
                    {{ item.isActive ? '启用' : '停用' }}
                  </span>
                </td>
                <td class="cell-text px-4 py-3 text-sm">{{ formatDate(item.lastLoginAt) }}</td>
                <td class="cell-text px-4 py-3 text-sm">{{ formatDate(item.createdAt) }}</td>
                <td class="px-4 py-3 text-sm">
                  <button
                    :class="[
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      item.isActive ? 'btn-danger' : 'btn-success',
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
          class="pagination-bar flex items-center justify-between border-t px-4 py-3 text-sm"
        >
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-3">
            <button
              :disabled="page <= 1"
              class="page-btn rounded border px-3 py-1 disabled:opacity-50"
              @click="applyFilters(page - 1)"
            >
              上一页
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button
              :disabled="page >= totalPages"
              class="page-btn rounded border px-3 py-1 disabled:opacity-50"
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

<style scoped>
  .page-title {
    color: var(--text-primary);
  }

  .page-description {
    color: var(--text-muted);
  }

  .search-input {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
  }

  .search-input::placeholder {
    color: var(--text-tertiary);
  }

  .btn-primary {
    background-color: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .btn-primary:hover {
    background-color: var(--color-brand-primary-dark);
  }

  .content-card {
    border-color: var(--border-secondary);
    background-color: var(--bg-tertiary);
  }

  .text-muted {
    color: var(--text-muted);
  }

  .error-text {
    color: var(--color-error-light);
  }

  .table-thead {
    background-color: var(--bg-secondary);
  }

  .table-header-cell {
    color: var(--text-muted);
  }

  .table-divide {
    border-color: var(--border-secondary);
  }

  .table-divide > tr {
    border-color: var(--border-secondary);
  }

  .user-name {
    color: var(--text-primary);
  }

  .username-hint {
    color: var(--text-tertiary);
  }

  .download-link {
    color: var(--color-brand-primary-light);
  }

  .download-link:hover {
    color: var(--color-brand-primary);
  }

  .cell-text {
    color: var(--text-muted);
  }

  .status-active {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }

  .status-inactive {
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--color-error-light);
  }

  .btn-danger {
    background-color: rgba(225, 29, 72, 0.2);
    color: var(--color-error-light);
  }

  .btn-danger:hover {
    background-color: rgba(225, 29, 72, 0.3);
  }

  .btn-success {
    background-color: rgba(5, 150, 105, 0.2);
    color: var(--color-success-light);
  }

  .btn-success:hover {
    background-color: rgba(5, 150, 105, 0.3);
  }

  .pagination-bar {
    border-color: var(--border-secondary);
    color: var(--text-muted);
  }

  .page-btn {
    border-color: var(--border-primary);
    color: var(--text-muted);
  }
</style>
