import { api } from '../../plugins/axios'

const materialReceivingService = {
  getDropdown() {
    return api.get('/warehouse/material-receiving/dropdown')
  }
}

export default materialReceivingService