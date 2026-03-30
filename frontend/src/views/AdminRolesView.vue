<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">角色权限管理</h1>
        <p class="mt-2 text-gray-600">
          维护后台角色、权限字典，以及角色与权限码之间的分配关系。
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          @click="openCreateRole"
        >
          新建角色
        </button>
        <button
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          @click="openCreatePermission"
        >
          新建权限
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-sm text-slate-500">角色总数</div>
        <div class="mt-3 text-3xl font-semibold text-slate-900">{{ roles.length }}</div>
        <div class="mt-2 text-xs text-slate-500">启用 {{ activeRoleCount }} / 停用 {{ inactiveRoleCount }}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-sm text-slate-500">权限总数</div>
        <div class="mt-3 text-3xl font-semibold text-slate-900">{{ permissions.length }}</div>
        <div class="mt-2 text-xs text-slate-500">
          启用 {{ activePermissionCount }} / 停用 {{ inactivePermissionCount }}
        </div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-sm text-slate-500">角色权限映射</div>
        <div class="mt-3 text-3xl font-semibold text-slate-900">{{ assignedPermissionCount }}</div>
        <div class="mt-2 text-xs text-slate-500">已分配到角色的权限码数量</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="text-sm text-slate-500">当前视图</div>
        <div class="mt-3 text-xl font-semibold text-slate-900">
          {{ activeTab === 'roles' ? '角色管理' : '权限字典' }}
        </div>
        <div class="mt-2 text-xs text-slate-500">创建、编辑、启停均已接通真实后台接口</div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-6 pt-4">
        <div class="flex flex-wrap gap-6">
          <button
            :class="getTabClass('roles')"
            @click="activeTab = 'roles'"
          >
            角色管理
          </button>
          <button
            :class="getTabClass('permissions')"
            @click="activeTab = 'permissions'"
          >
            权限管理
          </button>
        </div>
      </div>

      <div v-if="notice" class="px-6 pt-4">
        <div
          :class="[
            'rounded-xl border px-4 py-3 text-sm',
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700',
          ]"
        >
          {{ notice.message }}
        </div>
      </div>

      <div v-if="pageError" class="px-6 pt-4">
        <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ pageError }}
        </div>
      </div>

      <div v-if="activeTab === 'roles'" class="p-6">
        <div v-if="rolesLoading" class="py-16 text-center text-sm text-slate-500">角色列表加载中...</div>
        <div v-else-if="roles.length === 0" class="py-16 text-center text-sm text-slate-500">
          暂无角色数据，先创建一个角色吧。
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">角色</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">描述</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">权限</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">更新时间</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-for="role in roles" :key="role.id">
                <td class="px-4 py-4 text-sm text-slate-900">
                  <div class="font-medium">{{ role.name }}</div>
                  <div class="mt-1 text-xs text-slate-500">ID {{ role.id }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">
                  {{ role.description || '暂无描述' }}
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">
                  <div class="font-medium text-slate-900">{{ role.permissions?.length || 0 }} 项</div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="code in getRolePermissionPreview(role)"
                      :key="`${role.id}-${code}`"
                      class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                    >
                      {{ resolvePermissionLabel(code) }}
                    </span>
                    <span
                      v-if="(role.permissions?.length || 0) > 3"
                      class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                    >
                      +{{ (role.permissions?.length || 0) - 3 }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 text-sm">
                  <span :class="getStatusClass(role.isActive)">
                    {{ role.isActive ? '启用中' : '已停用' }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">{{ formatDate(role.updatedAt) }}</td>
                <td class="px-4 py-4 text-right text-sm font-medium">
                  <button class="mr-3 text-indigo-600 hover:text-indigo-800" @click="openEditRole(role)">
                    编辑
                  </button>
                  <button
                    :class="role.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'"
                    @click="toggleRoleStatus(role)"
                  >
                    {{ role.isActive ? '停用' : '启用' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="p-6">
        <div v-if="permissionsLoading" class="py-16 text-center text-sm text-slate-500">权限列表加载中...</div>
        <div v-else-if="permissions.length === 0" class="py-16 text-center text-sm text-slate-500">
          暂无权限数据，先创建一个权限吧。
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">权限代码</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">名称与描述</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">资源 / 动作</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">状态</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">更新时间</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-for="permission in permissions" :key="permission.id">
                <td class="px-4 py-4 text-sm text-slate-900">
                  <div class="font-mono font-medium">{{ permission.code }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">
                  <div class="font-medium text-slate-900">{{ permission.name }}</div>
                  <div class="mt-1 text-xs text-slate-500">{{ permission.description || '暂无描述' }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">
                  <div>{{ permission.resource || '通用资源' }}</div>
                  <div class="mt-1 text-xs text-slate-500">{{ permission.action || '未指定动作' }}</div>
                </td>
                <td class="px-4 py-4 text-sm">
                  <span :class="getStatusClass(permission.isActive)">
                    {{ permission.isActive ? '启用中' : '已停用' }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-slate-600">{{ formatDate(permission.updatedAt) }}</td>
                <td class="px-4 py-4 text-right text-sm font-medium">
                  <button
                    class="mr-3 text-indigo-600 hover:text-indigo-800"
                    @click="openEditPermission(permission)"
                  >
                    编辑
                  </button>
                  <button
                    :class="permission.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-emerald-600 hover:text-emerald-800'"
                    @click="togglePermissionStatus(permission)"
                  >
                    {{ permission.isActive ? '停用' : '启用' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showRoleModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
  >
    <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-900">{{ roleModalTitle }}</h2>
        <p class="mt-1 text-sm text-slate-500">角色名唯一，权限分配使用启用中的权限码。</p>
      </div>
      <form class="space-y-4 px-6 py-5" @submit.prevent="saveRole">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">角色名</label>
          <input
            v-model="roleForm.name"
            type="text"
            required
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
            placeholder="例如：content_admin"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">角色描述</label>
          <textarea
            v-model="roleForm.description"
            rows="3"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
            placeholder="描述该角色的职责范围"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">权限列表</label>
          <select
            v-model="roleForm.permissions"
            multiple
            class="h-48 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
          >
            <option
              v-for="permission in selectablePermissions"
              :key="permission.id"
              :value="permission.code"
            >
              {{ permission.name }} ({{ permission.code }})
            </option>
          </select>
          <p class="mt-1 text-xs text-slate-500">按住 Ctrl / Cmd 可多选。</p>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="roleForm.isActive" type="checkbox" class="rounded border-slate-300" />
          保存后保持角色为启用状态
        </label>
        <div class="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            @click="closeRoleModal"
          >
            取消
          </button>
          <button
            type="submit"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            :disabled="savingRole"
          >
            {{ savingRole ? '保存中...' : roleForm.id ? '保存修改' : '创建角色' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div
    v-if="showPermissionModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
  >
    <div class="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-900">{{ permissionModalTitle }}</h2>
        <p class="mt-1 text-sm text-slate-500">停用权限后，会自动从角色权限码中移除。</p>
      </div>
      <form class="space-y-4 px-6 py-5" @submit.prevent="savePermission">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">权限代码</label>
            <input
              v-model="permissionForm.code"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              placeholder="例如：media_update"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">权限名称</label>
            <input
              v-model="permissionForm.name"
              type="text"
              required
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
              placeholder="例如：更新媒体"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">权限描述</label>
          <textarea
            v-model="permissionForm.description"
            rows="3"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
            placeholder="补充说明该权限的用途"
          />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">关联资源</label>
            <select
              v-model="permissionForm.resource"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
            >
              <option value="">通用资源</option>
              <option value="user">用户</option>
              <option value="media">媒体</option>
              <option value="play_source">播放源</option>
              <option value="watch_history">观看历史</option>
              <option value="recommendation">推荐</option>
              <option value="admin">后台管理</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">动作</label>
            <select
              v-model="permissionForm.action"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring"
            >
              <option value="">未指定</option>
              <option value="create">create</option>
              <option value="read">read</option>
              <option value="update">update</option>
              <option value="delete">delete</option>
              <option value="manage">manage</option>
            </select>
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="permissionForm.isActive" type="checkbox" class="rounded border-slate-300" />
          保存后保持权限为启用状态
        </label>
        <div class="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            @click="closePermissionModal"
          >
            取消
          </button>
          <button
            type="submit"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            :disabled="savingPermission"
          >
            {{ savingPermission ? '保存中...' : permissionForm.id ? '保存修改' : '创建权限' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import {
    adminApi,
    type AdminPermissionItem,
    type AdminPermissionPayload,
    type AdminRoleItem,
    type AdminRolePayload,
  } from '@/api/admin';

  type TabKey = 'roles' | 'permissions';
  type NoticeType = 'success' | 'error';

  interface NoticeState {
    type: NoticeType;
    message: string;
  }

  interface RoleFormState {
    id: number | null;
    name: string;
    description: string;
    permissions: string[];
    isActive: boolean;
  }

  interface PermissionFormState {
    id: number | null;
    code: string;
    name: string;
    description: string;
    resource: string;
    action: string;
    isActive: boolean;
  }

  const activeTab = ref<TabKey>('roles');
  const roles = ref<AdminRoleItem[]>([]);
  const permissions = ref<AdminPermissionItem[]>([]);
  const rolesLoading = ref(false);
  const permissionsLoading = ref(false);
  const savingRole = ref(false);
  const savingPermission = ref(false);
  const pageError = ref<string | null>(null);
  const notice = ref<NoticeState | null>(null);

  const showRoleModal = ref(false);
  const showPermissionModal = ref(false);
  const roleForm = ref<RoleFormState>(createEmptyRoleForm());
  const permissionForm = ref<PermissionFormState>(createEmptyPermissionForm());

  const activeRoleCount = computed(() => roles.value.filter(role => role.isActive).length);
  const inactiveRoleCount = computed(() => roles.value.length - activeRoleCount.value);
  const activePermissionCount = computed(
    () => permissions.value.filter(permission => permission.isActive).length,
  );
  const inactivePermissionCount = computed(
    () => permissions.value.length - activePermissionCount.value,
  );
  const assignedPermissionCount = computed(() =>
    roles.value.reduce((count, role) => count + (role.permissions?.length || 0), 0),
  );
  const permissionLookup = computed(() => {
    return new Map(permissions.value.map(permission => [permission.code, permission.name]));
  });
  const selectablePermissions = computed(() => {
    return permissions.value.filter(
      permission => permission.isActive || roleForm.value.permissions.includes(permission.code),
    );
  });
  const roleModalTitle = computed(() => (roleForm.value.id ? '编辑角色' : '新建角色'));
  const permissionModalTitle = computed(() =>
    permissionForm.value.id ? '编辑权限' : '新建权限',
  );

  function createEmptyRoleForm(): RoleFormState {
    return {
      id: null,
      name: '',
      description: '',
      permissions: [],
      isActive: true,
    };
  }

  function createEmptyPermissionForm(): PermissionFormState {
    return {
      id: null,
      code: '',
      name: '',
      description: '',
      resource: '',
      action: '',
      isActive: true,
    };
  }

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'message' in error.response.data
    ) {
      const message = error.response.data.message;
      if (Array.isArray(message)) {
        return message.join('；');
      }
      if (typeof message === 'string') {
        return message;
      }
    }

    return error instanceof Error ? error.message : fallback;
  };

  const setNotice = (type: NoticeType, message: string) => {
    notice.value = { type, message };
  };

  const clearMessages = () => {
    pageError.value = null;
    notice.value = null;
  };

  const loadRoles = async () => {
    rolesLoading.value = true;
    try {
      roles.value = await adminApi.getRoles();
    } catch (error: unknown) {
      pageError.value = getErrorMessage(error, '加载角色列表失败');
    } finally {
      rolesLoading.value = false;
    }
  };

  const loadPermissions = async () => {
    permissionsLoading.value = true;
    try {
      permissions.value = await adminApi.getPermissions();
    } catch (error: unknown) {
      pageError.value = getErrorMessage(error, '加载权限列表失败');
    } finally {
      permissionsLoading.value = false;
    }
  };

  const reloadPermissionAndRoleData = async () => {
    await Promise.all([loadRoles(), loadPermissions()]);
  };

  const openCreateRole = () => {
    clearMessages();
    roleForm.value = createEmptyRoleForm();
    showRoleModal.value = true;
  };

  const openEditRole = (role: AdminRoleItem) => {
    clearMessages();
    roleForm.value = {
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: [...(role.permissions || [])],
      isActive: role.isActive,
    };
    showRoleModal.value = true;
  };

  const closeRoleModal = () => {
    showRoleModal.value = false;
    roleForm.value = createEmptyRoleForm();
  };

  const saveRole = async () => {
    if (!roleForm.value.name.trim()) {
      setNotice('error', '请先填写角色名');
      return;
    }

    savingRole.value = true;
    try {
      const payload: AdminRolePayload = {
        name: roleForm.value.name.trim(),
        description: roleForm.value.description.trim() || undefined,
        permissions: roleForm.value.permissions,
        isActive: roleForm.value.isActive,
      };

      if (roleForm.value.id) {
        await adminApi.updateRole(roleForm.value.id, payload);
        setNotice('success', `角色“${payload.name}”已更新`);
      } else {
        await adminApi.createRole(payload);
        setNotice('success', `角色“${payload.name}”已创建`);
      }

      closeRoleModal();
      await loadRoles();
    } catch (error: unknown) {
      setNotice('error', getErrorMessage(error, '保存角色失败'));
    } finally {
      savingRole.value = false;
    }
  };

  const toggleRoleStatus = async (role: AdminRoleItem) => {
    const nextStatus = !role.isActive;
    const actionLabel = nextStatus ? '启用' : '停用';

    if (!window.confirm(`确定要${actionLabel}角色“${role.name}”吗？`)) {
      return;
    }

    try {
      await adminApi.updateRole(role.id, { isActive: nextStatus });
      setNotice('success', `角色“${role.name}”已${actionLabel}`);
      await loadRoles();
    } catch (error: unknown) {
      setNotice('error', getErrorMessage(error, `${actionLabel}角色失败`));
    }
  };

  const openCreatePermission = () => {
    clearMessages();
    permissionForm.value = createEmptyPermissionForm();
    showPermissionModal.value = true;
  };

  const openEditPermission = (permission: AdminPermissionItem) => {
    clearMessages();
    permissionForm.value = {
      id: permission.id,
      code: permission.code,
      name: permission.name,
      description: permission.description || '',
      resource: permission.resource || '',
      action: permission.action || '',
      isActive: permission.isActive,
    };
    showPermissionModal.value = true;
  };

  const closePermissionModal = () => {
    showPermissionModal.value = false;
    permissionForm.value = createEmptyPermissionForm();
  };

  const savePermission = async () => {
    if (!permissionForm.value.code.trim() || !permissionForm.value.name.trim()) {
      setNotice('error', '请先填写权限代码和名称');
      return;
    }

    savingPermission.value = true;
    try {
      const payload: AdminPermissionPayload = {
        code: permissionForm.value.code.trim(),
        name: permissionForm.value.name.trim(),
        description: permissionForm.value.description.trim() || undefined,
        resource: permissionForm.value.resource || undefined,
        action: permissionForm.value.action || undefined,
        isActive: permissionForm.value.isActive,
      };

      if (permissionForm.value.id) {
        await adminApi.updatePermission(permissionForm.value.id, payload);
        setNotice('success', `权限“${payload.name}”已更新`);
      } else {
        await adminApi.createPermission(payload);
        setNotice('success', `权限“${payload.name}”已创建`);
      }

      closePermissionModal();
      await reloadPermissionAndRoleData();
    } catch (error: unknown) {
      setNotice('error', getErrorMessage(error, '保存权限失败'));
    } finally {
      savingPermission.value = false;
    }
  };

  const togglePermissionStatus = async (permission: AdminPermissionItem) => {
    const nextStatus = !permission.isActive;
    const actionLabel = nextStatus ? '启用' : '停用';

    if (!window.confirm(`确定要${actionLabel}权限“${permission.name}”吗？`)) {
      return;
    }

    try {
      await adminApi.updatePermission(permission.id, { isActive: nextStatus });
      setNotice('success', `权限“${permission.name}”已${actionLabel}`);
      await reloadPermissionAndRoleData();
    } catch (error: unknown) {
      setNotice('error', getErrorMessage(error, `${actionLabel}权限失败`));
    }
  };

  const getRolePermissionPreview = (role: AdminRoleItem) => {
    return (role.permissions || []).slice(0, 3);
  };

  const resolvePermissionLabel = (code: string) => {
    return permissionLookup.value.get(code) || code;
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleString('zh-CN');
  };

  const getTabClass = (tab: TabKey) => {
    return [
      'border-b-2 px-1 pb-3 text-sm font-medium transition',
      activeTab.value === tab
        ? 'border-indigo-500 text-indigo-600'
        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
    ];
  };

  const getStatusClass = (isActive: boolean) => {
    return [
      'rounded-full px-2.5 py-1 text-xs font-medium',
      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600',
    ];
  };

  onMounted(() => {
    clearMessages();
    void reloadPermissionAndRoleData();
  });
</script>
