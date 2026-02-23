import { defineStore } from 'pinia'
import { ref } from 'vue'
import lineService, { type LineParams } from '../../services/master-data/line.service'
import type { Line } from '../../types/master-data/line'

export const useLineStore = defineStore('line', () => {
  // State
  const lines = ref<Line[]>([])
  const dropdown = ref<Pick<Line, 'id' | 'name'>[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchLines(params: LineParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await lineService.getLines(params)
      const data = response.data
      if (data.status) {
        lines.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching lines:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdown() {
    try {
      const response = await lineService.getDropdown()
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching line dropdown:', e)
    }
  }

  async function createLine(data: Partial<Line>) {
    loading.value = true
    error.value = null
    try {
      const response = await lineService.createLine(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateLine(id: number | string, data: Partial<Line>) {
    loading.value = true
    error.value = null
    try {
      const response = await lineService.updateLine(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteLine(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await lineService.deleteLine(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadLines(params: LineParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await lineService.downloadLines(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadLines(file: File) {
    loading.value = true
    error.value = null
    try {
      const response = await lineService.uploadLines(file)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    lines,
    dropdown,
    meta,
    loading,
    error,
    fetchLines,
    fetchDropdown,
    createLine,
    updateLine,
    deleteLine,
    downloadLines,
    uploadLines
  }
})