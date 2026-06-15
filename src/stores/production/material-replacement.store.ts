import { defineStore } from 'pinia'
import productionMaterialControlService from '../../services/production/production-material-control.service'

export const useMaterialReplacementStore = defineStore('materialReplacement', {
  state: () => ({
    replacements: [] as any[],
    loading: false,
    meta: {
      page: 1,
      limit: 10,
      total: 0
    }
  }),

  actions: {
    async fetchReplacements(params: Record<string, any> = {}) {
      this.loading = true

      try {
        const res = await productionMaterialControlService.getReplacements(params)

        this.replacements = res.data.data || []
        this.meta = {
          page: res.data.meta?.page || 1,
          limit: res.data.meta?.limit || 10,
          total: res.data.meta?.total || 0
        }
      } finally {
        this.loading = false
      }
    },

    async createReplacement(data: any) {
      return productionMaterialControlService.createReplacement(data)
    }
  }
})