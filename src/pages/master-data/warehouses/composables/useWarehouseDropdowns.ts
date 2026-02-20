import { ref } from 'vue'
import warehouseService from '../../../../services/master-data/warehouse.service'

export interface DropdownOption {
  id: number
  name: string
}

/**
 * Composable for fetching warehouse dropdown data.
 */
export function useWarehouseDropdowns() {
  const warehouseCategories = ref<DropdownOption[]>([])
  const lines = ref<DropdownOption[]>([])

  async function fetchWarehouseCategories() {
    try {
      const res = await warehouseService.getWarehouseCategoriesDropdown()
      if (res.data.status) {
        warehouseCategories.value = res.data.data
      }
    } catch (err) {
      console.error('Error fetching warehouse categories:', err)
    }
  }

  async function fetchLines() {
    try {
      const res = await warehouseService.getLinesDropdown()
      if (res.data.status) {
        lines.value = res.data.data
      }
    } catch (err) {
      console.error('Error fetching lines:', err)
    }
  }

  return {
    warehouseCategories,
    lines,
    fetchWarehouseCategories,
    fetchLines
  }
}