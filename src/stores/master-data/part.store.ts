import { defineStore } from 'pinia'
import { ref } from 'vue'
import partService, { type PartsParams } from '../../services/master-data/part.service'
import type { Parts } from '../../types/master-data/parts'

export const usePartStore = defineStore('part', () => {
  // State
  const parts = ref<Parts[]>([])
  const dropdown = ref<Pick<Parts, 'id' | 'part_number' | 'part_name'>[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchParts(params: PartsParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await partService.getParts(params)
      const data = response.data
      if (data.status) {
        parts.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching parts:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdown(params?: Record<string, any>) {
    try {
      const response = await partService.getDropdown(params)
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching part dropdown:', e)
    }
  }

  async function createPart(data: Partial<Parts>) {
    loading.value = true
    error.value = null
    try {
      const response = await partService.createPart(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePart(id: number | string, data: Partial<Parts>) {
    loading.value = true
    error.value = null
    try {
      const response = await partService.updatePart(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePart(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await partService.deletePart(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadParts(params: PartsParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await partService.downloadParts(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadPart(file: File) {
    loading.value = true
    error.value = null
    try {
      const response = await partService.uploadPart(file)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    parts,
    dropdown,
    meta,
    loading,
    error,
    fetchParts,
    fetchDropdown,
    createPart,
    updatePart,
    deletePart,
    downloadParts,
    uploadPart
  }
})