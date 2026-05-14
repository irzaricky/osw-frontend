import { defineStore } from 'pinia'
import { ref } from 'vue'
import materialReceivingService from '../../services/warehouse/material-receiving.service'
import type { MaterialReceivingDropdown } from '../../types/warehouse/material-receiving'

export const useMaterialReceivingStore = defineStore('material-receiving', () => {
  // State
  const dropdown = ref<MaterialReceivingDropdown[]>([])

  const error = ref<string | null>(null)

  // Actions - Dropdown
  async function fetchDropdown() {
    try {
      const response = await materialReceivingService.getDropdown()
      const data = response.data
      if (data.status) {
        dropdown.value = data.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message
      console.error('Error fetching material receiving dropdown:', e)
    }
  }

  return {
    // State
    dropdown,
    error,

    // Actions
    fetchDropdown
  }
})