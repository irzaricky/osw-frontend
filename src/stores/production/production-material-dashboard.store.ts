import { defineStore } from 'pinia'
import productionMaterialControlService from '../../services/production/production-material-control.service'

export const useProductionMaterialDashboardStore = defineStore('productionMaterialDashboard', {
  state: () => ({
    summary: null as any,
    loading: false
  }),

  actions: {
    async fetchDashboard() {
      this.loading = true

      try {
        const res = await productionMaterialControlService.getDashboard()
        this.summary = res.data.data || null
      } finally {
        this.loading = false
      }
    }
  }
})