import { defineStore } from 'pinia'
import { ref } from 'vue'
import supplierService, { type SuppliersParams } from '../../services/master-data/supplier.service'
import type { Suppliers } from '../../types/master-data/suppliers'

export const useSupplierStore = defineStore('supplier', () => {
  // State
  const suppliers = ref<Suppliers[]>([])
  const dropdown = ref<Pick<Suppliers, 'id' | 'supplier_code' | 'name'>[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchSuppliers(params: SuppliersParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await supplierService.getSuppliers(params)
      const data = response.data
      if (data.status) {
        suppliers.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching suppliers:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchDropdown(params?: Record<string, any>) {
    try {
      const response = await supplierService.getDropdown(params)
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      console.error('Error fetching supplier dropdown:', e)
    }
  }

  async function createSupplier(data: Partial<Suppliers>) {
    loading.value = true
    error.value = null
    try {
      const response = await supplierService.createSupplier(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSupplier(id: number | string, data: Partial<Suppliers>) {
    loading.value = true
    error.value = null
    try {
      const response = await supplierService.updateSupplier(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteSupplier(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await supplierService.deleteSupplier(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    suppliers,
    dropdown,
    meta,
    loading,
    error,
    fetchSuppliers,
    fetchDropdown,
    createSupplier,
    updateSupplier,
    deleteSupplier
  }
})