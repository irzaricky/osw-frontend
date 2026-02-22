import { defineStore } from 'pinia'
import { ref } from 'vue'
import factoryService, { type FactoryParams } from '../../services/master-data/factory.service'
import type { Factory } from '../../types/master-data/factory'

export const useFactoryStore = defineStore('factory', () => {
  // State
  const factories = ref<Factory[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchFactories(params: FactoryParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await factoryService.getFactories(params)
      const data = response.data
      if (data.status) {
        factories.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching factories:', e)
    } finally {
      loading.value = false
    }
  }

  async function createFactory(data: Partial<Factory>) {
    loading.value = true
    error.value = null
    try {
      const response = await factoryService.createFactory(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateFactory(id: number | string, data: Partial<Factory>) {
    loading.value = true
    error.value = null
    try {
      const response = await factoryService.updateFactory(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteFactory(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await factoryService.deleteFactory(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadFactories(params: FactoryParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await factoryService.downloadFactories(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadFactories(file: File) {
    loading.value = true
    error.value = null
    try {
      const response = await factoryService.uploadFactories(file)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    factories,
    meta,
    loading,
    error,
    fetchFactories,
    createFactory,
    updateFactory,
    deleteFactory,
    downloadFactories,
    uploadFactories
  }
})