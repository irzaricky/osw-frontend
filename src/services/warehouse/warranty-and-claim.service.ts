import { api } from '../../plugins/axios'

export interface WarrantyAndClaimParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  part?: string
  supplier?: string
  [key: string]: any
}

const warrantyAndClaimService = {
  // Dropdowns
  getPartsDropdown() {
    return api.get('/warehouse/warranty-and-claim/dropdown/parts')
  },
  getSuppliersDropdown() {
    return api.get('/warehouse/warranty-and-claim/dropdown/suppliers')
  },

  // Warranty and Claim
  getWarrantyAndClaims(params: WarrantyAndClaimParams) {
    return api.get('/warehouse/warranty-and-claim', { params })
  }
}

export default warrantyAndClaimService