import { api } from '../../plugins/axios'

const goodReceiptService = {

  // Get list good receipt
  getGoodReceipts() {
    return api.get(
      '/warehouse/good-receipt'
    )
  },

  // Approve good receipt
  approveGoodReceipt(
    mr_id: number | string,

    payload?: {
      remarks?: string
    }
  ) {
    return api.post(
      `/warehouse/good-receipt/approve/${mr_id}`,
      payload
    )
  }
}

export default goodReceiptService