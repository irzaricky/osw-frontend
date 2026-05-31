import { api } from '../../plugins/axios'

export interface WarrantyAndClaimParams {
  page?: number
  limit?: number
  [key: string]: any
}

const warrantyAndClaimService = {
  // Warranty and Claim
  getWarrantyAndClaims(params: WarrantyAndClaimParams) {
    return api.get('/warehouse/warranty-and-claim', { params })
  }
}

export default warrantyAndClaimService