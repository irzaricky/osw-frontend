import { defineStore } from 'pinia'
import { ref } from 'vue'
import customerService, { type CustomerParams } from '../../services/master-data/customer.service'
import type { Customer } from '../../types/master-data/customer'

export const useCustomerStore = defineStore('customer', () => {
  // State
  const customers = ref<Customer[]>([])
  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchCustomers(params: CustomerParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await customerService.getCustomers(params)
      const data = response.data
      if (data.status) {
        customers.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching customers:', e)
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(data: Partial<Customer>) {
    loading.value = true
    error.value = null
    try {
      const response = await customerService.createCustomer(data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: number | string, data: Partial<Customer>) {
    loading.value = true
    error.value = null
    try {
      const response = await customerService.updateCustomer(id, data)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await customerService.deleteCustomer(id)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function downloadCustomers(params: CustomerParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await customerService.downloadCustomers(params)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    meta,
    loading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    downloadCustomers
  }
})
