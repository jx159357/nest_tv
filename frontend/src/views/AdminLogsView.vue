<template>
  <div class="admin-logs">
    <div class="admin-header">
      <h1>系统日志管理</h1>
      <p>查看和管理系统操作日志</p>
    </div>

    <div class="admin-content">
      <!-- 搜索和过滤 -->
      <div class="filter-section">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索日志内容..."
            @input="handleSearch"
          />
          <button @click="handleSearch">搜索</button>
        </div>

        <div class="filter-controls">
          <select v-model="selectedLevel" @change="handleFilter">
            <option value="">所有级别</option>
            <option value="error">错误</option>
            <option value="warn">警告</option>
            <option value="info">信息</option>
            <option value="debug">调试</option>
          </select>

          <select v-model="selectedModule" @change="handleFilter">
            <option value="">所有模块</option>
            <option value="auth">认证</option>
            <option value="users">用户管理</option>
            <option value="media">媒体管理</option>
            <option value="crawler">爬虫</option>
            <option value="system">系统</option>
          </select>

          <input v-model="selectedDate" type="date" @change="handleFilter" />
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="stat-card">
          <h3>总日志数</h3>
          <div class="stat-value">{{ totalLogs }}</div>
        </div>
        <div class="stat-card error">
          <h3>错误日志</h3>
          <div class="stat-value">{{ errorLogs }}</div>
        </div>
        <div class="stat-card warning">
          <h3>警告日志</h3>
          <div class="stat-value">{{ warningLogs }}</div>
        </div>
        <div class="stat-card info">
          <h3>今日日志</h3>
          <div class="stat-value">{{ todayLogs }}</div>
        </div>
      </div>

      <!-- 日志列表 -->
      <div class="logs-list">
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="logs.length === 0" class="empty-state">
          <p>暂无日志记录</p>
        </div>

        <div v-else class="logs-table">
          <div class="table-header">
            <div class="col-time">时间</div>
            <div class="col-level">级别</div>
            <div class="col-module">模块</div>
            <div class="col-message">消息</div>
            <div class="col-user">用户</div>
            <div class="col-ip">IP地址</div>
            <div class="col-actions">操作</div>
          </div>

          <div v-for="log in logs" :key="log.id" class="table-row" :class="`level-${log.level}`">
            <div class="col-time">
              <div class="log-time">{{ formatDateTime(log.createdAt) }}</div>
            </div>

            <div class="col-level">
              <span class="level-badge" :class="log.level">
                {{ getLevelText(log.level) }}
              </span>
            </div>

            <div class="col-module">
              <span class="module-badge">{{ log.module }}</span>
            </div>

            <div class="col-message">
              <div class="log-message" :title="log.message">
                {{ truncateMessage(log.message) }}
              </div>
            </div>

            <div class="col-user">
              {{ log.user?.username || '-' }}
            </div>

            <div class="col-ip">
              {{ log.ipAddress || '-' }}
            </div>

            <div class="col-actions">
              <button class="btn-details" @click="viewDetails(log)">查看详情</button>
              <button class="btn-delete" @click="deleteLog(log.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <button :disabled="currentPage === 1" class="btn-prev" @click="prevPage">上一页</button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" class="btn-next" @click="nextPage">
          下一页
        </button>
      </div>
    </div>

    <!-- 日志详情弹窗 -->
    <div v-if="selectedLog" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>日志详情</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="log-detail-item">
            <label>ID:</label>
            <span>{{ selectedLog.id }}</span>
          </div>

          <div class="log-detail-item">
            <label>时间:</label>
            <span>{{ formatDateTime(selectedLog.createdAt) }}</span>
          </div>

          <div class="log-detail-item">
            <label>级别:</label>
            <span class="level-badge" :class="selectedLog.level">
              {{ getLevelText(selectedLog.level) }}
            </span>
          </div>

          <div class="log-detail-item">
            <label>模块:</label>
            <span>{{ selectedLog.module }}</span>
          </div>

          <div class="log-detail-item">
            <label>消息:</label>
            <span>{{ selectedLog.message }}</span>
          </div>

          <div class="log-detail-item">
            <label>用户:</label>
            <span>{{ selectedLog.user?.username || '系统' }}</span>
          </div>

          <div class="log-detail-item">
            <label>IP地址:</label>
            <span>{{ selectedLog.ipAddress || '-' }}</span>
          </div>

          <div v-if="selectedLog.stackTrace" class="log-detail-item">
            <label>堆栈跟踪:</label>
            <pre class="stack-trace">{{ selectedLog.stackTrace }}</pre>
          </div>

          <div v-if="selectedLog.metadata" class="log-detail-item">
            <label>元数据:</label>
            <pre class="metadata">{{ JSON.stringify(selectedLog.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import type { SystemLog, LogLevel, LogModule } from '@/types';

  // 响应式数据
  const loading = ref(true);
  const logs = ref<SystemLog[]>([]);
  const searchQuery = ref('');
  const selectedLevel = ref<LogLevel | ''>('');
  const selectedModule = ref<LogModule | ''>('');
  const selectedDate = ref('');
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalLogs = ref(0);
  const errorLogs = ref(0);
  const warningLogs = ref(0);
  const todayLogs = ref(0);
  const selectedLog = ref<SystemLog | null>(null);

  // 计算属性
  const getLevelText = (level: LogLevel) => {
    const levelMap = {
      [LogLevel.ERROR]: '错误',
      [LogLevel.WARN]: '警告',
      [LogLevel.INFO]: '信息',
      [LogLevel.DEBUG]: '调试',
    };
    return levelMap[level] || level;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const truncateMessage = (message: string) => {
    if (message.length > 50) {
      return message.substring(0, 50) + '...';
    }
    return message;
  };

  // 方法
  const fetchLogs = async () => {
    try {
      loading.value = true;
      // 这里应该调用实际的API
      // const response = await api.get('/admin/logs', {
      //   params: {
      //     page: currentPage.value,
      //     search: searchQuery.value,
      //     level: selectedLevel.value,
      //     module: selectedModule.value,
      //     date: selectedDate.value
      //   }
      // })
      // logs.value = response.data.logs
      // totalPages.value = response.data.totalPages
      // totalLogs.value = response.data.total
      // errorLogs.value = response.data.errorCount
      // warningLogs.value = response.data.warningCount
      // todayLogs.value = response.data.todayCount

      // 模拟数据
      logs.value = [];
      totalPages.value = 1;
      totalLogs.value = 0;
      errorLogs.value = 0;
      warningLogs.value = 0;
      todayLogs.value = 0;

      setTimeout(() => {
        loading.value = false;
      }, 1000);
    } catch (error) {
      console.error('获取日志失败:', error);
      loading.value = false;
    }
  };

  const handleSearch = () => {
    currentPage.value = 1;
    fetchLogs();
  };

  const handleFilter = () => {
    currentPage.value = 1;
    fetchLogs();
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
      fetchLogs();
    }
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
      fetchLogs();
    }
  };

  const viewDetails = (log: SystemLog) => {
    selectedLog.value = log;
  };

  const closeModal = () => {
    selectedLog.value = null;
  };

  const deleteLog = async (id: number) => {
    if (!confirm('确定要删除这条日志吗？')) {
      return;
    }

    try {
      // 这里应该调用实际的API
      // await api.delete(`/admin/logs/${id}`)

      // 刷新列表
      fetchLogs();
    } catch (error) {
      console.error('删除日志失败:', error);
    }
  };

  // 生命周期
  onMounted(() => {
    fetchLogs();
  });
</script>

<style scoped>
  .admin-logs {
    padding: 2rem;
    max-width: 1400px;
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
    flex-wrap: wrap;
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
    flex-wrap: wrap;
  }

  .filter-controls select,
  .filter-controls input {
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

  .stat-card.error .stat-value {
    color: #dc3545;
  }

  .stat-card.warning .stat-value {
    color: #ffc107;
  }

  .stat-card.info .stat-value {
    color: #17a2b8;
  }

  /* 日志列表 */
  .logs-list {
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
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .logs-table {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr 0.8fr 1fr 3fr 1fr 1fr 1fr;
    background: #f8f9fa;
    padding: 1rem;
    font-weight: bold;
    border-bottom: 1px solid #ddd;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr 0.8fr 1fr 3fr 1fr 1fr 1fr;
    padding: 1rem;
    border-bottom: 1px solid #eee;
    align-items: center;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row.level-error {
    background: #ffe6e6;
  }

  .table-row.level-warn {
    background: #fff3cd;
  }

  /* 日志级别样式 */
  .level-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    color: white;
  }

  .level-badge.error {
    background: #dc3545;
  }

  .level-badge.warn {
    background: #ffc107;
    color: #000;
  }

  .level-badge.info {
    background: #17a2b8;
  }

  .level-badge.debug {
    background: #6c757d;
  }

  .module-badge {
    background: #e9ecef;
    color: #495057;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .log-message {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
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

  /* 弹窗样式 */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #ddd;
  }

  .modal-header h2 {
    margin: 0;
    color: #333;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .log-detail-item {
    display: flex;
    margin-bottom: 1rem;
    align-items: flex-start;
  }

  .log-detail-item label {
    font-weight: bold;
    color: #666;
    width: 100px;
    flex-shrink: 0;
    margin-right: 1rem;
  }

  .log-detail-item span {
    flex: 1;
    color: #333;
  }

  .stack-trace,
  .metadata {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid #ddd;
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
</style>
