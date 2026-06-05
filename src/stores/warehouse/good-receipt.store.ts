import { defineStore } from 'pinia'
import { ref } from 'vue'
import goodReceiptService, { type GoodReceiptParams } from '../../services/warehouse/good-receipt.service'
import type { GoodReceipt } from '../../types/warehouse/good-receipt'

export const useGoodReceiptStore = defineStore('good-receipt', () => {
  // State
  const goodReceipts = ref<GoodReceipt[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Good Receipt
  async function fetchGoodReceipts(params: GoodReceiptParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await goodReceiptService.getGoodReceipts(params)
      const data = response.data
      if (data.status) {
        goodReceipts.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching good receipts:', e)
    } finally {
      loading.value = false
    }
  }

  async function fetchGoodReceipt(mr_id: number | string) {
    loading.value = true
    error.value = null
    try {
      const response = await goodReceiptService.getGoodReceipt(mr_id)
      const data = response.data
      return data.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching good receipt:', e)
    } finally {
      loading.value = false
    }
  }

  async function approveGoodReceipt(mr_id: number | string, payload?: { remarks?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await goodReceiptService.approveGoodReceipt(mr_id, payload)
      return response.data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error approving good receipt:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function reportGoodReceipt(mr_id: number | string) {
    try {
      const response = await goodReceiptService.reportGoodReceipt(mr_id)

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
    
      window.open(url, '_blank')
      
      return { url }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error opening report:', e)
      throw e
    }
  }

  return {
    // State
    goodReceipts,
    meta,
    loading,
    error,

    // Actions
    fetchGoodReceipts,
    fetchGoodReceipt,
    approveGoodReceipt,
    reportGoodReceipt
  }
})