import { defineStore } from 'pinia'
import { ref } from 'vue'

import goodReceiptService from '../../services/warehouse/good-receipt.service'

import type {
  GoodReceipt
} from '../../types/warehouse/good-receipt'

export const useGoodReceiptStore =
  defineStore(
    'good-receipt',
    () => {

      // State
      const goodReceipts =
        ref<GoodReceipt[]>([])

      const loading =
        ref(false)

      const error =
        ref<string | null>(null)

      // ======================
      // Actions
      // ======================

      async function fetchGoodReceipts() {
        loading.value = true
        error.value = null

        try {
          const response =
            await goodReceiptService.getGoodReceipts()

          const data =
            response.data

          if (data.status) {
            goodReceipts.value =
              data.data
          }
        } catch (e: any) {
          error.value =
            e.response?.data
              ?.message ||
            e.message

          console.error(
            'Error fetching good receipts:',
            e
          )
        } finally {
          loading.value = false
        }
      }

      async function approveGoodReceipt(
        mr_id:
          number | string,

        payload?: {
          remarks?: string
        }
      ) {
        loading.value = true
        error.value = null

        try {
          const response =
            await goodReceiptService.approveGoodReceipt(
              mr_id,
              payload
            )

          return response.data
        } catch (e: any) {
          error.value =
            e.response?.data
              ?.message ||
            e.message

          console.error(
            'Error approving good receipt:',
            e
          )

          throw e
        } finally {
          loading.value = false
        }
      }

      return {

        // State
        goodReceipts,
        loading,
        error,

        // Actions
        fetchGoodReceipts,
        approveGoodReceipt
      }
    }
  )