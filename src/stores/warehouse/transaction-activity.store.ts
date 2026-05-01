import { defineStore } from 'pinia'
import { ref } from 'vue'
import transactionActivityService, {
  type TransactionActivityParams
} from '../../services/warehouse/transaction-activity.service'
import type { TransactionActivity } from '../../types/warehouse/transaction-activity'

export const useTransactionActivityStore = defineStore('transaction-activity', () => {
  const transactionActivities = ref<TransactionActivity[]>([])
  const transactionActivityDetail = ref<TransactionActivity | null>(null)

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTransactionActivities(params: TransactionActivityParams = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await transactionActivityService.getTransactionActivities(params)
      const data = response.data

      if (data.status) {
        transactionActivities.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactionActivityDetail(id: number | string) {
    loading.value = true
    error.value = null

    try {
      const response = await transactionActivityService.getTransactionActivityDetail(id)
      const data = response.data

      if (data.status) {
        transactionActivityDetail.value = data.data
      }

      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    transactionActivities,
    transactionActivityDetail,
    meta,
    loading,
    error,

    fetchTransactionActivities,
    fetchTransactionActivityDetail
  }
})