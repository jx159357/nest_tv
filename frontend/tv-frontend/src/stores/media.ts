import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useMediaStore = defineStore('media', () => {
  const authStore = useAuthStore()
  const mediaList = ref([])
  const currentMedia = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchMediaList = async (params = {}) => {
    loading.value = true
    try {
      const response = await authStore.api.get('/media', { params })
      mediaList.value = response.data.data
      pagination.value = {
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages
      }
      return response.data
    } catch (error) {
      console.error('获取媒体列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchMediaDetail = async (id) => {
    loading.value = true
    try {
      const response = await authStore.api.get(`/media/${id}`)
      currentMedia.value = response.data
      return response.data
    } catch (error) {
      console.error('获取媒体详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchPopularMedia = async (limit = 10) => {
    try {
      const response = await authStore.api.get('/media/popular', { params: { limit } })
      return response.data
    } catch (error) {
      console.error('获取热门媒体失败:', error)
      throw error
    }
  }

  const fetchLatestMedia = async (limit = 10) => {
    try {
      const response = await authStore.api.get('/media/latest', { params: { limit } })
      return response.data
    } catch (error) {
      console.error('获取最新媒体失败:', error)
      throw error
    }
  }

  const fetchTopRatedMedia = async (limit = 10, minRating = 8) => {
    try {
      const response = await authStore.api.get('/media/top-rated', { 
        params: { limit, minRating } 
      })
      return response.data
    } catch (error) {
      console.error('获取高评分媒体失败:', error)
      throw error
    }
  }

  const incrementViewCount = async (id) => {
    try {
      await authStore.api.patch(`/media/${id}/view`)
    } catch (error) {
      console.error('增加观看次数失败:', error)
    }
  }

  const clearCurrentMedia = () => {
    currentMedia.value = null
  }

  return {
    mediaList,
    currentMedia,
    loading,
    pagination,
    fetchMediaList,
    fetchMediaDetail,
    fetchPopularMedia,
    fetchLatestMedia,
    fetchTopRatedMedia,
    incrementViewCount,
    clearCurrentMedia
  }
})