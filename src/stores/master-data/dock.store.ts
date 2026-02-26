import { defineStore } from 'pinia'
import { ref } from 'vue'
import dockService, { type DockParams } from '../../services/master-data/dock.service'
import type { Dock } from '../../types/master-data/dock'

export const useDockStore = defineStore('dock', () => {
  // State
  const docks = ref<Dock[]>([])
  const dropdown = ref<Pick<Dock, 'id' | 'name'>[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Docks
  async function fetchDropdown() {
    try {
      const response = await dockService.getDropdown()
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching dock dropdown:', e)
    }
  }

  async function fetchDocks(params: DockParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await dockService.getDocks(params)
      const data = response.data
      if (data.status) {
        docks.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching docks:', e)
    } finally {
      loading.value = false
    }
  }

  async function createDock(data: Partial<Dock>) {
    loading.value = true
    error.value = null
    try {
      const response = await dockService.createDock(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateDock(id: number | string, data: Partial<Dock>) {
    loading.value = true
    error.value = null
    try {
      const response = await dockService.updateDock(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteDock(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await dockService.deleteDock(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    docks,
    dropdown,
    meta,
    loading,
    error,

    // Actions
    fetchDropdown,
    fetchDocks,
    createDock,
    updateDock,
    deleteDock
  }
})