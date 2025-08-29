<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-gray-900">视频平台</router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-gray-700 hover:text-gray-900">
              首页
            </router-link>
            <router-link to="/profile" class="text-gray-700 hover:text-gray-900">
              个人中心
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="mb-6 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">播放源管理</h1>
        <button
          @click="showAddModal = true"
          class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          添加播放源
        </button>
      </div>

      <!-- 筛选区域 -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">影视资源</label>
            <input
              v-model="filters.mediaResourceId"
              type="number"
              placeholder="资源ID"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
            <select
              v-model="filters.type"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              <option value="online">在线播放</option>
              <option value="download">下载链接</option>
              <option value="magnet">磁力链接</option>
              <option value="ed2k">电驴链接</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              v-model="filters.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">全部</option>
              <option value="active">可用</option>
              <option value="inactive">不可用</option>
              <option value="error">错误</option>
              <option value="checking">检查中</option>
            </select>
          </div>
          
          <div class="flex items-end space-x-2">
            <button
              @click="loadPlaySources"
              class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              搜索
            </button>
            <button
              @click="resetFilters"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      <!-- 播放源列表 -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div v-if="loading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4">加载中...</p>
        </div>
        
        <div v-else-if="playSources.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">资源</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分辨率</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">播放次数</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="playSource in playSources" :key="playSource.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ playSource.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div v-if="playSource.mediaResource">
                    {{ playSource.mediaResource.title }}
                  </div>
                  <div v-else class="text-gray-500">
                    ID: {{ playSource.mediaResourceId }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ playSource.type }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      playSource.status === 'active' ? 'bg-green-100 text-green-800' :
                      playSource.status === 'error' ? 'bg-red-100 text-red-800' :
                      playSource.status === 'checking' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ getStatusText(playSource.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ playSource.resolution || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ playSource.priority }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ playSource.playCount }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="validatePlaySource(playSource.id)"
                      class="text-indigo-600 hover:text-indigo-900"
                      :disabled="validatingSourceId === playSource.id"
                    >
                      {{ validatingSourceId === playSource.id ? '验证中...' : '验证' }}
                    </button>
                    <button
                      @click="editPlaySource(playSource)"
                      class="text-blue-600 hover:text-blue-900"
                    >
                      编辑
                    </button>
                    <button
                      @click="deletePlaySource(playSource.id)"
                      class="text-red-600 hover:text-red-900"
                      :disabled="deletingSourceId === playSource.id"
                    >
                      {{ deletingSourceId === playSource.id ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="text-center py-12">
          <p class="text-gray-500">暂无播放源数据</p>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          显示第 {{ (pagination.page - 1) * pagination.limit + 1 }} 到 {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条记录，
          共 {{ pagination.total }} 条记录
        </div>
        <div class="flex space-x-2">
          <button
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            v-for="page in getPageNumbers()"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-1 border rounded-md text-sm font-medium',
              page === pagination.page 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages"
            class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
    </main>

    <!-- 添加/编辑播放源模态框 -->
    <div v-if="showAddModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              {{ showEditModal ? '编辑播放源' : '添加播放源' }}
            </h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>
          
          <form @submit.prevent="savePlaySource" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">影视资源ID *</label>
                <input
                  v-model="currentPlaySource.mediaResourceId"
                  type="number"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
                <select
                  v-model="currentPlaySource.type"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="online">在线播放</option>
                  <option value="download">下载链接</option>
                  <option value="magnet">磁力链接</option>
                  <option value="ed2k">电驴链接</option>
                </select>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">播放链接 *</label>
                <input
                  v-model="currentPlaySource.url"
                  type="url"
                  required
                  placeholder="请输入播放链接"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">分辨率</label>
                <input
                  v-model="currentPlaySource.resolution"
                  type="text"
                  placeholder="如: 1080p, 720p"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">语言</label>
                <input
                  v-model="currentPlaySource.language"
                  type="text"
                  placeholder="如: 中文, 英文"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">字幕链接</label>
                <input
                  v-model="currentPlaySource.subtitleUrl"
                  type="url"
                  placeholder="字幕文件链接"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <input
                  v-model.number="currentPlaySource.priority"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="currentPlaySource.isActive"
                  type="checkbox"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  是否启用
                </label>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
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
const playSources = ref([])
const loading = ref(false)
const saving = ref(false)
const validatingSourceId = ref(null)
const deletingSourceId = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)

// 分页和筛选
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

const filters = ref({
  mediaResourceId: '',
  type: '',
  status: '',
  activeOnly: false
})

// 当前编辑的播放源
const currentPlaySource = ref({
  id: null,
  mediaResourceId: '',
  type: 'online',
  url: '',
  resolution: '',
  language: '',
  subtitleUrl: '',
  priority: 1,
  isActive: true
})

// 加载播放源列表
const loadPlaySources = async () => {
  loading.value = true
  
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      ...filters.value
    }
    
    // 清理空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    
    const response = await authStore.api.get('/play-sources', { params })
    
    if (response.data && response.data.data) {
      playSources.value = response.data.data
      pagination.value = {
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages
      }
    } else {
      playSources.value = []
      pagination.value = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    }
  } catch (error) {
    console.error('加载播放源失败:', error)
    playSources.value = []
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    mediaResourceId: '',
    type: '',
    status: '',
    activeOnly: false
  }
  pagination.value.page = 1
  loadPlaySources()
}

// 分页导航
const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    loadPlaySources()
  }
}

// 获取分页数字
const getPageNumbers = () => {
  const totalPages = pagination.value.totalPages
  const currentPage = pagination.value.page
  const pages = []
  
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
  }
  
  return pages
}

// 状态文本映射
const getStatusText = (status) => {
  const statusMap = {
    'active': '可用',
    'inactive': '不可用',
    'error': '错误',
    'checking': '检查中'
  }
  return statusMap[status] || status
}

// 验证播放源
const validatePlaySource = async (id) => {
  try {
    validatingSourceId.value = id
    await authStore.api.patch(`/play-sources/${id}/validate`)
    loadPlaySources() // 重新加载数据以更新状态
  } catch (error) {
    console.error('验证播放源失败:', error)
  } finally {
    validatingSourceId.value = null
  }
}

// 删除播放源
const deletePlaySource = async (id) => {
  if (!confirm('确定要删除这个播放源吗？')) {
    return
  }
  
  try {
    deletingSourceId.value = id
    await authStore.api.delete(`/play-sources/${id}`)
    loadPlaySources() // 重新加载数据
  } catch (error) {
    console.error('删除播放源失败:', error)
  } finally {
    deletingSourceId.value = null
  }
}

// 编辑播放源
const editPlaySource = (playSource) => {
  currentPlaySource.value = { ...playSource }
  showEditModal.value = true
  showAddModal.value = false
}

// 保存播放源（添加或编辑）
const savePlaySource = async () => {
  try {
    saving.value = true
    
    if (showEditModal.value) {
      // 编辑播放源
      await authStore.api.patch(`/play-sources/${currentPlaySource.value.id}`, currentPlaySource.value)
    } else {
      // 添加播放源
      await authStore.api.post('/play-sources', currentPlaySource.value)
    }
    
    closeModal()
    loadPlaySources() // 重新加载数据
  } catch (error) {
    console.error('保存播放源失败:', error)
  } finally {
    saving.value = false
  }
}

// 打开添加模态框
const openAddModal = () => {
  currentPlaySource.value = {
    id: null,
    mediaResourceId: '',
    type: 'online',
    url: '',
    resolution: '',
    language: '',
    subtitleUrl: '',
    priority: 1,
    isActive: true
  }
  showAddModal.value = true
  showEditModal.value = false
}

// 关闭模态框
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
}

// 组件挂载时加载数据
onMounted(() => {
  loadPlaySources()
})
</script>