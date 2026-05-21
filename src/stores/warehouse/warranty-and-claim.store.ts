import { defineStore } from 'pinia'
import { ref } from 'vue'

import warrantyAndClaimService from '../../services/warehouse/warranty-and-claim.service'

import type {
  WarrantyClaim
} from '../../types/warehouse/warranty-and-claim'

export const useWarrantyAndClaimStore =
  defineStore(
    'warranty-and-claim',
    () => {

      // State
      const warrantyAndClaims =
        ref<WarrantyClaim[]>([])

      const loading =
        ref(false)

      const error =
        ref<string | null>(null)

      // ======================
      // Actions
      // ======================

      async function fetchWarrantyAndClaims() {
        loading.value = true
        error.value = null

        try {
          const response =
            await warrantyAndClaimService.getWarrantyAndClaims()

          const data =
            response.data

          if (data.status) {
            warrantyAndClaims.value =
              data.data
          }
        } catch (e: any) {
          error.value =
            e.response?.data
              ?.message ||
            e.message

          console.error(
            'Error fetching warranty and claims:',
            e
          )
        } finally {
          loading.value = false
        }
      }

      return {

        // State
        warrantyAndClaims,
        loading,
        error,

        // Actions
        fetchWarrantyAndClaims
      }
    }
  )