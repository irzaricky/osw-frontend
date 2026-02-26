import { defineStore } from 'pinia'
import { ref } from 'vue'
import defectService, { type DefectParams, DefectCategoryParams } from '../../services/master-data/defect.service'
import type { Defect, DefectCategory } from '../../types/master-data/defect'

export const useDefectStore = defineStore('defect', () => {
  // State
  const defects = ref<Defect[]>([])
  const defectCategories = ref<DefectCategory[]>([])
  const dropdown = ref<Pick<Defect, 'id' | 'name'>[]>([])
  const dropdownCategories = ref<Pick<DefectCategory, 'id' | 'name'>[]>([])

  const defectMeta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const defectCategoryMeta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Defects
  async function fetchDefects(params: DefectParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.getDefects(params)
      const data = response.data
      if (data.status) {
        defects.value = data.data.rows
        defectMeta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching defects:', e)
    } finally {
      loading.value = false
    }
  }

  async function createDefect(data: Partial<Defect>) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.createDefect(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateDefect(id: number | string, data: Partial<Defect>) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.updateDefect(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteDefect(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.deleteDefect(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Defect Categories
  async function fetchDefectCategories(params: DefectCategoryParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.getDefectCategories(params)
      const data = response.data
      if (data.status) {
        defectCategories.value = data.data.rows
        defectCategoryMeta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching defect categories:', e)
    } finally {
      loading.value = false
    }
  }

  async function createDefectCategory(data: Partial<DefectCategory>) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.createDefectCategory(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateDefectCategory(id: number | string, data: Partial<DefectCategory>) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.updateDefectCategory(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteDefectCategory(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await defectService.deleteDefectCategory(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actions - Dropdowns
  async function fetchDropdown() {
    try {
      const response = await defectService.getDropdown()
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching defect dropdown:', e)
    }
  }  

  async function fetchDefectCategoriesDropdown() {
    try {
      const response = await defectService.getDefectCategoriesDropdown()
      const data = response.data
      if (data.status) {
        dropdownCategories.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching defect dropdown:', e)
    }
  }  

  return {
    // State
    defects,
    defectCategories,
    defectMeta,
    defectCategoryMeta,
    dropdown,
    dropdownCategories,
    loading,
    error,

    // Actions
    fetchDefects,
    createDefect,
    updateDefect,
    deleteDefect,
    fetchDefectCategories,
    createDefectCategory,
    updateDefectCategory,
    deleteDefectCategory,
    fetchDropdown,
    fetchDefectCategoriesDropdown
  }
})