import { api } from '../../plugins/axios'

const warrantyAndClaimService = {

  // Get list warranty and claim
  getWarrantyAndClaims() {
    return api.get(
      '/warehouse/warranty-and-claim'
    )
  }
}

export default warrantyAndClaimService