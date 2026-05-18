<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="page-title text-2xl font-bold">角色权限管理</h1>
        <p class="page-description mt-2">维护后台角色、权限字典，以及角色与权限码之间的分配关系。</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          class="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          @click="openCreateRole"
        >
          新建角色
        </button>
        <button
          class="btn-success rounded-lg px-4 py-2 text-sm font-medium"
          @click="openCreatePermission"
        >
          新建权限
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="stat-card rounded-xl p-5 shadow-xl">
        <div class="stat-label text-sm">角色总数</div>
        <div class="stat-value mt-3 text-3xl font-semibold">{{ roles.length }}</div>
        <div class="stat-hint mt-2 text-xs">
          启用 {{ activeRoleCount }} / 停用 {{ inactiveRoleCount }}
        </div>
      </div>
      <div class="stat-card rounded-xl p-5 shadow-xl">
        <div class="stat-label text-sm">权限总数</div>
        <div class="stat-value mt-3 text-3xl font-semibold">{{ permissions.length }}</div>
        <div class="stat-hint mt-2 text-xs">
          启用 {{ activePermissionCount }} / 停用 {{ inactivePermissionCount }}
        </div>
      </div>
      <div class="stat-card rounded-xl p-5 shadow-xl">
        <div class="stat-label text-sm">角色权限映射</div>
        <div class="stat-value mt-3 text-3xl font-semibold">{{ assignedPermissionCount }}</div>
        <div class="stat-hint mt-2 text-xs">已分配到角色的权限码数量</div>
      </div>
      <div class="stat-card rounded-xl p-5 shadow-xl">
        <div class="stat-label text-sm">当前视图</div>
        <div class="stat-value mt-3 text-xl font-semibold">
          {{ activeTab === 'roles' ? '角色管理' : '权限字典' }}
        </div>
        <div class="stat-hint mt-2 text-xs">创建、编辑、启停均已接通真实后台接口</div>
      </div>
    </div>

    <div class="content-panel rounded-xl shadow-xl">
      <div class="tab-bar px-6 pt-4">
        <div class="flex flex-wrap gap-6">
          <button :class="getTabClass('roles')" @click="activeTab = 'roles'">角色管理</button>
          <button :class="getTabClass('permissions')" @click="activeTab = 'permissions'">
            权限管理
          </button>
        </div>
      </div>

      <div v-if="notice" class="px-6 pt-4">
        <div
          :class="[
            'notice-box rounded-xl px-4 py-3 text-sm',
            notice.type === 'success' ? 'notice-success' : 'notice-error',
          ]"
        >
          {{ notice.message }}
        </div>
      </div>

      <div v-if="pageError" class="px-6 pt-4">
        <div
          class="notice-box notice-error rounded-xl px-4 py-3 text-sm"
        >
          {{ pageError }}
        </div>
      </div>

      <div v-if="activeTab === 'roles'" class="p-6">
        <div v-if="rolesLoading" class="loading-hint py-16 text-center text-sm">
          角色列表加载中...
        </div>
        <div v-else-if="roles.length === 0" class="loading-hint py-16 text-center text-sm">
          暂无角色数据，先创建一个角色吧。
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table-base min-w-full">
            <thead class="table-thead">
              <tr>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  角色
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  描述
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  权限
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  状态
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  更新时间
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="role in roles" :key="role.id">
                <td class="cell-primary px-4 py-4 text-sm">
                  <div class="font-medium">{{ role.name }}</div>
                  <div class="cell-hint mt-1 text-xs">ID {{ role.id }}</div>
                </td>
                <td class="cell-text px-4 py-4 text-sm">
                  {{ role.description || '暂无描述' }}
                </td>
                <td class="cell-text px-4 py-4 text-sm">
                  <div class="cell-primary font-medium">
                    {{ role.permissions?.length || 0 }} 项
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="code in getRolePermissionPreview(role)"
                      :key="`${role.id}-${code}`"
                      class="badge-muted rounded-full px-2.5 py-1 text-xs"
                    >
                      {{ resolvePermissionLabel(code) }}
                    </span>
                    <span
                      v-if="(role.permissions?.length || 0) > 3"
                      class="badge-muted rounded-full px-2.5 py-1 text-xs"
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
                <td class="cell-text px-4 py-4 text-sm">{{ formatDate(role.updatedAt) }}</td>
                <td class="px-4 py-4 text-right text-sm font-medium">
                  <button
                    class="action-brand mr-3"
                    @click="openEditRole(role)"
                  >
                    编辑
                  </button>
                  <button
                    :class="role.isActive ? 'action-warning' : 'action-success'"
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
        <div v-if="permissionsLoading" class="loading-hint py-16 text-center text-sm">
          权限列表加载中...
        </div>
        <div v-else-if="permissions.length === 0" class="loading-hint py-16 text-center text-sm">
          暂无权限数据，先创建一个权限吧。
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table-base min-w-full">
            <thead class="table-thead">
              <tr>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  权限代码
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  名称与描述
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  资源 / 动作
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  状态
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                >
                  更新时间
                </th>
                <th
                  class="table-header-cell px-4 py-3 text-right text-xs font-medium uppercase tracking-wider"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="permission in permissions" :key="permission.id">
                <td class="cell-primary px-4 py-4 text-sm">
                  <div class="font-mono font-medium">{{ permission.code }}</div>
                </td>
                <td class="cell-text px-4 py-4 text-sm">
                  <div class="cell-primary font-medium">{{ permission.name }}</div>
                  <div class="cell-hint mt-1 text-xs">
                    {{ permission.description || '暂无描述' }}
                  </div>
                </td>
                <td class="cell-text px-4 py-4 text-sm">
                  <div>{{ permission.resource || '通用资源' }}</div>
                  <div class="cell-hint mt-1 text-xs">
                    {{ permission.action || '未指定动作' }}
                  </div>
                </td>
                <td class="px-4 py-4 text-sm">
                  <span :class="getStatusClass(permission.isActive)">
                    {{ permission.isActive ? '启用中' : '已停用' }}
                  </span>
                </td>
                <td class="cell-text px-4 py-4 text-sm">
                  {{ formatDate(permission.updatedAt) }}
                </td>
                <td class="px-4 py-4 text-right text-sm font-medium">
                  <button
                    class="action-brand mr-3"
                    @click="openEditPermission(permission)"
                  >
                    编辑
                  </button>
                  <button
                    :class="permission.isActive ? 'action-warning' : 'action-success'"
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
    class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
  >
    <div class="modal-content w-full max-w-2xl rounded-2xl shadow-2xl">
      <div class="modal-header px-6 py-4">
        <h2 class="modal-title text-lg font-semibold">{{ roleModalTitle }}</h2>
        <p class="modal-description mt-1 text-sm">角色名唯一，权限分配使用启用中的权限码。</p>
      </div>
      <form class="space-y-4 px-6 py-5" @submit.prevent="saveRole">
        <div>
          <label class="form-label mb-1 block text-sm font-medium">角色名</label>
          <input
            v-model="roleForm.name"
            type="text"
            required
            class="form-input w-full rounded-lg px-3 py-2 text-sm"
            placeholder="例如：content_admin"
          />
        </div>
        <div>
          <label class="form-label mb-1 block text-sm font-medium">角色描述</label>
          <textarea
            v-model="roleForm.description"
            rows="3"
            class="form-input w-full rounded-lg px-3 py-2 text-sm"
            placeholder="描述该角色的职责范围"
          />
        </div>
        <div>
          <label class="form-label mb-1 block text-sm font-medium">权限列表</label>
          <select
            v-model="roleForm.permissions"
            multiple
            class="form-input h-48 w-full rounded-lg px-3 py-2 text-sm"
          >
            <option
              v-for="permission in selectablePermissions"
              :key="permission.id"
              :value="permission.code"
            >
              {{ permission.name }} ({{ permission.code }})
            </option>
          </select>
          <p class="form-hint mt-1 text-xs">按住 Ctrl / Cmd 可多选。</p>
        </div>
        <label class="form-check flex items-center gap-2 text-sm">
          <input
            v-model="roleForm.isActive"
            type="checkbox"
            class="form-checkbox rounded"
          />
          保存后保持角色为启用状态
        </label>
        <div class="modal-footer flex justify-end gap-3 pt-4">
          <button
            type="button"
            class="btn-ghost rounded-lg px-4 py-2 text-sm"
            @click="closeRoleModal"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
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
    class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
  >
    <div class="modal-content w-full max-w-2xl rounded-2xl shadow-2xl">
      <div class="modal-header px-6 py-4">
        <h2 class="modal-title text-lg font-semibold">{{ permissionModalTitle }}</h2>
        <p class="modal-description mt-1 text-sm">停用权限后，会自动从角色权限码中移除。</p>
      </div>
      <form class="space-y-4 px-6 py-5" @submit.prevent="savePermission">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="form-label mb-1 block text-sm font-medium">权限代码</label>
            <input
              v-model="permissionForm.code"
              type="text"
              required
              class="form-input w-full rounded-lg px-3 py-2 text-sm"
              placeholder="例如：media_update"
            />
          </div>
          <div>
            <label class="form-label mb-1 block text-sm font-medium">权限名称</label>
            <input
              v-model="permissionForm.name"
              type="text"
              required
              class="form-input w-full rounded-lg px-3 py-2 text-sm"
              placeholder="例如：更新媒体"
            />
          </div>
        </div>
        <div>
          <label class="form-label mb-1 block text-sm font-medium">权限描述</label>
          <textarea
            v-model="permissionForm.description"
            rows="3"
            class="form-input w-full rounded-lg px-3 py-2 text-sm"
            placeholder="补充说明该权限的用途"
          />
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="form-label mb-1 block text-sm font-medium">关联资源</label>
            <select
              v-model="permissionForm.resource"
              class="form-input w-full rounded-lg px-3 py-2 text-sm"
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
            <label class="form-label mb-1 block text-sm font-medium">动作</label>
            <select
              v-model="permissionForm.action"
              class="form-input w-full rounded-lg px-3 py-2 text-sm"
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
        <label class="form-check flex items-center gap-2 text-sm">
          <input
            v-model="permissionForm.isActive"
            type="checkbox"
            class="form-checkbox rounded"
          />
          保存后保持权限为启用状态
        </label>
        <div class="modal-footer flex justify-end gap-3 pt-4">
          <button
            type="button"
            class="btn-ghost rounded-lg px-4 py-2 text-sm"
            @click="closePermissionModal"
          >
            取消
          </button>
          <button
            type="submit"
            class="btn-success rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60"
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
  import { showConfirm } from '@/composables/useModal';
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
  const permissionModalTitle = computed(() => (permissionForm.value.id ? '编辑权限' : '新建权限'));

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
        setNotice('success', `角色"${payload.name}"已更新`);
      } else {
        await adminApi.createRole(payload);
        setNotice('success', `角色"${payload.name}"已创建`);
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

    showConfirm(`确定要${actionLabel}角色"${role.name}"吗？`, async () => {
      try {
        await adminApi.updateRole(role.id, { isActive: nextStatus });
        setNotice('success', `角色"${role.name}"已${actionLabel}`);
        await loadRoles();
      } catch (error: unknown) {
        setNotice('error', getErrorMessage(error, `${actionLabel}角色失败`));
      }
    });
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
        setNotice('success', `权限"${payload.name}"已更新`);
      } else {
        await adminApi.createPermission(payload);
        setNotice('success', `权限"${payload.name}"已创建`);
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

    showConfirm(`确定要${actionLabel}权限"${permission.name}"吗？`, async () => {
      try {
        await adminApi.updatePermission(permission.id, { isActive: nextStatus });
        setNotice('success', `权限"${permission.name}"已${actionLabel}`);
        await reloadPermissionAndRoleData();
      } catch (error: unknown) {
        setNotice('error', getErrorMessage(error, `${actionLabel}权限失败`));
      }
    });
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
      'tab-btn',
      activeTab.value === tab ? 'tab-active' : 'tab-inactive',
    ];
  };

  const getStatusClass = (isActive: boolean) => {
    return [
      'status-badge',
      isActive ? 'status-active' : 'status-inactive',
    ];
  };

  onMounted(() => {
    clearMessages();
    void reloadPermissionAndRoleData();
  });
</script>

<style scoped>
  /* ===== 页面标题 ===== */
  .page-title {
    color: var(--text-primary);
  }

  .page-description {
    color: var(--text-muted);
  }

  /* ===== 按钮 ===== */
  .btn-primary {
    background-color: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .btn-primary:hover {
    background-color: var(--color-brand-primary-dark);
  }

  .btn-success {
    background-color: var(--color-success);
    color: var(--text-inverse);
  }

  .btn-success:hover {
    background-color: var(--color-success-dark);
  }

  .btn-ghost {
    border: 1px solid var(--border-primary);
    color: var(--text-muted);
  }

  .btn-ghost:hover {
    background-color: var(--bg-secondary);
  }

  /* ===== 统计卡片 ===== */
  .stat-card {
    border: 1px solid var(--border-primary);
    background-color: var(--bg-tertiary);
  }

  .stat-label {
    color: var(--text-muted);
  }

  .stat-value {
    color: var(--text-primary);
  }

  .stat-hint {
    color: var(--text-tertiary);
  }

  /* ===== 内容面板 ===== */
  .content-panel {
    border: 1px solid var(--border-primary);
    background-color: var(--bg-tertiary);
  }

  /* ===== 标签栏 ===== */
  .tab-bar {
    border-bottom: 1px solid var(--border-primary);
  }

  .tab-btn {
    border-bottom: 2px solid transparent;
    padding-bottom: 0.75rem;
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: var(--transition-normal);
  }

  .tab-active {
    border-bottom-color: var(--color-brand-primary);
    color: var(--color-brand-primary-light);
  }

  .tab-inactive {
    border-bottom-color: transparent;
    color: var(--text-tertiary);
  }

  .tab-inactive:hover {
    border-bottom-color: var(--border-secondary);
    color: var(--text-muted);
  }

  /* ===== 通知/告警 ===== */
  .notice-box {
    border: 1px solid transparent;
  }

  .notice-success {
    border-color: rgba(16, 185, 129, 0.3);
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--color-success-light);
  }

  .notice-error {
    border-color: rgba(239, 68, 68, 0.3);
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--color-error-light);
  }

  /* ===== 加载/空状态 ===== */
  .loading-hint {
    color: var(--text-muted);
  }

  /* ===== 表格 ===== */
  .table-base {
    border-collapse: separate;
    border-spacing: 0;
  }

  .table-base th,
  .table-base td {
    border-bottom: 1px solid var(--border-primary);
  }

  .table-thead {
    background-color: var(--bg-secondary);
  }

  .table-header-cell {
    color: var(--text-muted);
  }

  .table-body tr {
    border-bottom: 1px solid var(--border-primary);
  }

  .cell-primary {
    color: var(--text-primary);
  }

  .cell-text {
    color: var(--text-muted);
  }

  .cell-hint {
    color: var(--text-tertiary);
  }

  /* ===== 徽章 ===== */
  .badge-muted {
    background-color: rgba(100, 116, 139, 0.15);
    color: var(--text-muted);
  }

  /* ===== 状态标签 ===== */
  .status-badge {
    border-radius: var(--radius-full);
    padding: 0.25rem 0.625rem;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  .status-active {
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light);
  }

  .status-inactive {
    background-color: rgba(100, 116, 139, 0.15);
    color: var(--text-muted);
  }

  /* ===== 操作链接 ===== */
  .action-brand {
    color: var(--color-brand-primary-light);
  }

  .action-brand:hover {
    color: var(--color-brand-primary);
  }

  .action-warning {
    color: var(--color-warning-light);
  }

  .action-warning:hover {
    color: var(--color-warning);
  }

  .action-success {
    color: var(--color-success-light);
  }

  .action-success:hover {
    color: var(--color-success);
  }

  /* ===== 弹窗 ===== */
  .modal-overlay {
    background-color: var(--bg-overlay);
  }

  .modal-content {
    border: 1px solid var(--border-secondary);
    background-color: var(--bg-card);
  }

  .modal-header {
    border-bottom: 1px solid var(--border-primary);
  }

  .modal-title {
    color: var(--text-primary);
  }

  .modal-description {
    color: var(--text-muted);
  }

  .modal-footer {
    border-top: 1px solid var(--border-primary);
  }

  /* ===== 表单 ===== */
  .form-label {
    color: var(--text-muted);
  }

  .form-input {
    border: 1px solid var(--border-primary);
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    outline: none;
  }

  .form-input::placeholder {
    color: var(--text-tertiary);
  }

  .form-input:focus {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }

  .form-checkbox {
    border-color: var(--border-primary);
    background-color: var(--bg-secondary);
  }

  .form-hint {
    color: var(--text-tertiary);
  }

  .form-check {
    color: var(--text-muted);
  }
</style>
