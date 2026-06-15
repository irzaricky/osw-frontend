import { defineStore } from 'pinia'
import productionMaterialControlService from '../../services/production/production-material-control.service'

export const useProductionMaterialResultStore = defineStore('productionMaterialResult', {
  state: () => ({
    productionResults: [] as any[],
    loading: false,
    meta: {
      page: 1,
      limit: 10,
      total: 0
    }
  }),

  actions: {
    async fetchProductionResults(params: Record<string, any> = {}) {
      this.loading = true

      try {
        const res = await productionMaterialControlService.getProductionResults(params)

        this.productionResults = res.data.data || []
        this.meta = {
          page: res.data.meta?.page || 1,
          limit: res.data.meta?.limit || 10,
          total: res.data.meta?.total || 0
        }
      } finally {
        this.loading = false
      }
    },

    async createProductionResult(data: any) {
      return productionMaterialControlService.createProductionResult(data)
    }
  }
})