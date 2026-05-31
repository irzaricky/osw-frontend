import { defineStore } from 'pinia'
import { ref } from 'vue'
import warrantyAndClaimService, { type WarrantyAndClaimParams } from '../../services/warehouse/warranty-and-claim.service'
import type { WarrantyAndClaim } from '../../types/warehouse/warranty-and-claim'

export const useWarrantyAndClaimStore = defineStore('warranty-and-claim', () => {
  // State
  const warrantyAndClaims = ref<WarrantyAndClaim[]>([])

  const meta = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
      
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions - Warranty and Claim
  async function fetchWarrantyAndClaims(params: WarrantyAndClaimParams = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await warrantyAndClaimService.getWarrantyAndClaims(params)
      const data = response.data
      if (data.status) {
        warrantyAndClaims.value = data.data.rows
        meta.value = {
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.count,
          totalPages: data.data.totalPages
        }
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching warranty and claims:', e)
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    warrantyAndClaims,
    meta,
    loading,
    error,

    // Actions
    fetchWarrantyAndClaims
  }
})