<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">角色权限管理</h1>
        <p class="mt-2 text-gray-600">管理系统角色和权限分配</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="showCreateRole = true"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          创建角色
        </button>
        <button
          @click="showCreatePermission = true"
          class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          创建权限
        </button>
      </div>
    </div>

    <!-- Tab切换 -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          @click="activeTab = 'roles'"
          :class="[
            activeTab === 'roles'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          角色管理
        </button>
        <button
          @click="activeTab = 'permissions'"
          :class="[
            activeTab === 'permissions'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          权限管理
        </button>
      </nav>
    </div>

    <!-- 角色管理 -->
    <div v-show="activeTab === 'roles'" class="space-y-6">
      <!-- 角色列表 -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div v-if="rolesLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-gray-500">加载角色列表...</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">权限数量</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="role in roles" :key="role.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ role.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ role.description || '无描述' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ (role.permissions || []).length }} 个权限
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      role.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ role.isActive ? '启用' : '禁用' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editRole(role)"
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    编辑
                  </button>
                  <button
                    @click="deleteRole(role)"
                    class="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 权限管理 -->
    <div v-show="activeTab === 'permissions'" class="space-y-6">
      <!-- 权限列表 -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div v-if="permissionsLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-gray-500">加载权限列表...</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">权限代码</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">权限名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资源</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="permission in permissions" :key="permission.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 font-mono">{{ permission.code }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ permission.name }}</div>
                  <div v-if="permission.description" class="text-sm text-gray-500 mt-1">{{ permission.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {{ permission.resource || '通用' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {{ permission.action || '无' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      permission.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ permission.isActive ? '启用' : '禁用' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editPermission(permission)"
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    编辑
                  </button>
                  <button
                    @click="deletePermission(permission)"
                    class="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- 创建角色弹窗 -->
  <div v-if="showCreateRole" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">创建角色</h3>
        </div>
        <form @submit.prevent="createRole" class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色名称 *</label>
            <input
              v-model="newRole.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：content_admin"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色描述</label>
            <textarea
              v-model="newRole.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="角色职责描述"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">权限列表</label>
            <select
              v-model="newRole.permissions"
              multiple
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option v-for="permission in permissions" :key="permission.id" :value="permission.code">
                {{ permission.name }} ({{ permission.code }})
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">按住 Ctrl/Cmd 键多选</p>
          </div>
        </form>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            @click="showCreateRole = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            type="submit"
            @click="createRole"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 创建权限弹窗 -->
  <div v-if="showCreatePermission" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">创建权限</h3>
        </div>
        <form @submit.prevent="createPermission" class="px-6 py-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">权限代码 *</label>
            <input
              v-model="newPermission.code"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：user_create"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">权限名称 *</label>
            <input
              v-model="newPermission.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="如：创建用户"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">权限描述</label>
            <textarea
              v-model="newPermission.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="权限功能描述"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">关联资源</label>
            <select
              v-model="newPermission.resource"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">无</option>
              <option value="user">用户</option>
              <option value="media">媒体</option>
              <option value="play_source">播放源</option>
              <option value="watch_history">观看历史</option>
              <option value="recommendation">推荐</option>
              <option value="admin">管理</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
            <select
              v-model="newPermission.action"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">无</option>
              <option value="create">创建</option>
              <option value="read">读取</option>
              <option value="update">更新</option>
              <option value="delete">删除</option>
              <option value="export">导出</option>
              <option value="import">导入</option>
            </select>
          </div>
        </form>
        <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            @click="showCreatePermission = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            取消
          </button>
          <button
            type="submit"
            @click="createPermission"
            class="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 状态管理
const activeTab = ref('roles')
const roles = ref([])
const permissions = ref([])
const rolesLoading = ref(false)
const permissionsLoading = ref(false)

// 弹窗状态
const showCreateRole = ref(false)
const showCreatePermission = ref(false)

// 新建角色表单
const newRole = ref({
  name: '',
  description: '',
  permissions: []
})

// 新建权限表单
const newPermission = ref({
  code: '',
  name: '',
  description: '',
  resource: '',
  action: ''
})

// 加载角色列表
const loadRoles = async () => {
  rolesLoading.value = true
  try {
    const response = await authStore.api.get('/admin/roles')
    roles.value = response.data
  } catch (error) {
    console.error('加载角色失败:', error)
  } finally {
    rolesLoading.value = false
  }
}

// 加载权限列表
const loadPermissions = async () => {
  permissionsLoading.value = true
  try {
    const response = await authStore.api.get('/admin/permissions')
    permissions.value = response.data
  } catch (error) {
    console.error('加载权限失败:', error)
  } finally {
    permissionsLoading.value = false
  }
}

// 创建角色
const createRole = async () => {
  if (!newRole.value.name.trim()) {
    alert('请输入角色名称')
    return
  }

  try {
    const response = await authStore.api.post('/admin/roles', {
      name: newRole.value.name,
      description: newRole.value.description,
      permissions: newRole.value.permissions
    })
    
    // 重置表单
    newRole.value = { name: '', description: '', permissions: [] }
    showCreateRole.value = false
    
    // 重新加载列表
    await loadRoles()
  } catch (error) {
    console.error('创建角色失败:', error)
    alert('创建角色失败：' + (error.response?.data?.message || error.message))
  }
}

// 创建权限
const createPermission = async () => {
  if (!newPermission.value.code.trim() || !newPermission.value.name.trim()) {
    alert('请填写权限代码和名称')
    return
  }

  try {
    const response = await authStore.api.post('/admin/permissions', {
      code: newPermission.value.code,
      name: newPermission.value.name,
      description: newPermission.value.description,
      resource: newPermission.value.resource || undefined,
      action: newPermission.value.action || undefined
    })
    
    // 重置表单
    newPermission.value = { code: '', name: '', description: '', resource: '', action: '' }
    showCreatePermission.value = false
    
    // 重新加载列表
    await loadPermissions()
  } catch (error) {
    console.error('创建权限失败:', error)
    alert('创建权限失败：' + (error.response?.data?.message || error.message))
  }
}

// 编辑角色（待实现）
const editRole = (role) => {
  alert('编辑角色功能待实现')
}

// 删除角色（待实现）
const deleteRole = async (role) => {
  if (!confirm(`确定要删除角色 "${role.name}" 吗？`)) {
    return
  }
  
  try {
    await authStore.api.delete(`/admin/roles/${role.id}`)
    await loadRoles()
  } catch (error) {
    console.error('删除角色失败:', error)
    alert('删除角色失败')
  }
}

// 编辑权限（待实现）
const editPermission = (permission) => {
  alert('编辑权限功能待实现')
}

// 删除权限（待实现）
const deletePermission = async (permission) => {
  if (!confirm(`确定要删除权限 "${permission.name}" 吗？`)) {
    return
  }
  
  try {
    await authStore.api.delete(`/admin/permissions/${permission.id}`)
    await loadPermissions()
  } catch (error) {
    console.error('删除权限失败:', error)
    alert('删除权限失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>