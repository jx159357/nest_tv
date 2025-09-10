<template>
  <div class="admin-watch-history">
    <div class="admin-header">
      <h1>观看历史管理</h1>
      <p>管理用户的观看记录和历史数据</p>
    </div>

    <div class="admin-content">
      <!-- 搜索和过滤 -->
      <div class="filter-section">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索用户或媒体标题..."
            @input="handleSearch"
          />
          <button @click="handleSearch">搜索</button>
        </div>
        
        <div class="filter-controls">
          <select v-model="selectedUser" @change="handleFilter">
            <option value="">所有用户</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.username }}
            </option>
          </select>
          
          <select v-model="sortBy" @change="handleSort">
            <option value="createdAt">按观看时间</option>
            <option value="updatedAt">按更新时间</option>
            <option value="progress">按观看进度</option>
          </select>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-card">
          <h3>总观看记录</h3>
          <div class="stat-value">{{ totalRecords }}</div>
        </div>
        <div class="stat-card">
          <h3>活跃用户</h3>
          <div class="stat-value">{{ activeUsers }}</div>
        </div>
        <div class="stat-card">
          <h3>今日观看</h3>
          <div class="stat-value">{{ todayViews }}</div>
        </div>
      </div>

      <!-- 观看历史列表 -->
      <div class="history-list">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="watchHistory.length === 0" class="empty-state">
          <p>暂无观看历史记录</p>
        </div>
        
        <div v-else class="history-table">
          <div class="table-header">
            <div class="col-user">用户</div>
            <div class="col-media">媒体内容</div>
            <div class="col-progress">观看进度</div>
            <div class="col-duration">观看时长</div>
            <div class="col-time">观看时间</div>
            <div class="col-actions">操作</div>
          </div>
          
          <div v-for="record in watchHistory" :key="record.id" class="table-row">
            <div class="col-user">
              <div class="user-info">
                <img :src="record.user?.avatar || '/default-avatar.png'" alt="用户头像" />
                <div class="user-details">
                  <div class="username">{{ record.user?.username }}</div>
                  <div class="user-email">{{ record.user?.email }}</div>
                </div>
              </div>
            </div>
            
            <div class="col-media">
              <div class="media-info">
                <img :src="record.mediaResource?.poster || '/default-poster.png'" alt="媒体海报" />
                <div class="media-details">
                  <div class="media-title">{{ record.mediaResource?.title }}</div>
                  <div class="media-type">{{ record.mediaResource?.type }}</div>
                </div>
              </div>
            </div>
            
            <div class="col-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgressPercentage(record) + '%' }"></div>
              </div>
              <div class="progress-text">{{ getProgressPercentage(record) }}%</div>
            </div>
            
            <div class="col-duration">
              {{ formatDuration(record.watchDuration) }}
            </div>
            
            <div class="col-time">
              <div class="watch-time">{{ formatDate(record.updatedAt) }}</div>
              <div class="watch-date">{{ formatDateTime(record.createdAt) }}</div>
            </div>
            
            <div class="col-actions">
              <button @click="viewDetails(record)" class="btn-details">查看详情</button>
              <button @click="deleteRecord(record.id)" class="btn-delete">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="btn-prev"
        >
          上一页
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="btn-next"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const loading = ref(true)
const watchHistory = ref([])
const users = ref([])
const searchQuery = ref('')
const selectedUser = ref('')
const sortBy = ref('createdAt')
const currentPage = ref(1)
const totalPages = ref(1)
const totalRecords = ref(0)
const activeUsers = ref(0)
const todayViews = ref(0)

// 计算属性
const getProgressPercentage = (record: any) => {
  if (!record.totalDuration) return 0
  return Math.round((record.watchDuration / record.totalDuration) * 100)
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 方法
const fetchWatchHistory = async () => {
  try {
    loading.value = true
    // 这里应该调用实际的API
    // const response = await api.get('/admin/watch-history', {
    //   params: {
    //     page: currentPage.value,
    //     search: searchQuery.value,
    //     userId: selectedUser.value,
    //     sortBy: sortBy.value
    //   }
    // })
    // watchHistory.value = response.data.records
    // totalPages.value = response.data.totalPages
    // totalRecords.value = response.data.total
    
    // 模拟数据
    watchHistory.value = []
    totalPages.value = 1
    totalRecords.value = 0
    activeUsers.value = 0
    todayViews.value = 0
    
    setTimeout(() => {
      loading.value = false
    }, 1000)
  } catch (error) {
    console.error('获取观看历史失败:', error)
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    // 这里应该调用实际的API
    // const response = await api.get('/admin/users')
    // users.value = response.data
    
    // 模拟数据
    users.value = []
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchWatchHistory()
}

const handleFilter = () => {
  currentPage.value = 1
  fetchWatchHistory()
}

const handleSort = () => {
  currentPage.value = 1
  fetchWatchHistory()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchWatchHistory()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchWatchHistory()
  }
}

const viewDetails = (record: any) => {
  // 查看观看历史详情
  console.log('查看详情:', record)
}

const deleteRecord = async (id: number) => {
  if (!confirm('确定要删除这条观看记录吗？')) {
    return
  }
  
  try {
    // 这里应该调用实际的API
    // await api.delete(`/admin/watch-history/${id}`)
    
    // 刷新列表
    fetchWatchHistory()
  } catch (error) {
    console.error('删除观看记录失败:', error)
  }
}

// 生命周期
onMounted(() => {
  fetchWatchHistory()
  fetchUsers()
})
</script>

<style scoped>
.admin-watch-history {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.admin-header p {
  color: #666;
}

.admin-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

/* 搜索和过滤 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
}

.search-box input {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
}

.search-box button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-controls select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 统计信息 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

/* 观看历史列表 */
.history-list {
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.history-table {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr;
  background: #f8f9fa;
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

/* 表格列样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-info img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  color: #333;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
}

.media-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.media-info img {
  width: 48px;
  height: 72px;
  border-radius: 4px;
  object-fit: cover;
}

.media-details {
  display: flex;
  flex-direction: column;
}

.media-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.25rem;
}

.media-type {
  font-size: 0.8rem;
  color: #666;
  background: #e9ecef;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.progress-fill {
  height: 100%;
  background: #28a745;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: #666;
}

.watch-time {
  font-weight: bold;
  color: #333;
}

.watch-date {
  font-size: 0.8rem;
  color: #666;
}

.col-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-details,
.btn-delete {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-details {
  background: #007bff;
  color: white;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.btn-prev,
.btn-next {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.btn-prev:disabled,
.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: bold;
  color: #666;
}
</style>