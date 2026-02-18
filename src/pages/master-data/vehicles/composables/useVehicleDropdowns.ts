import { ref } from 'vue'
import vehicleService from '../../../../services/master-data/vehicle.service'

export interface DropdownOption {
  id: number
  name: string
}

/**
 * Composable for fetching vehicle dropdown data.
 */
export function useVehicleDropdowns() {
  const vehicleTypes = ref<DropdownOption[]>([])

  async function fetchVehicleTypes() {
    try {
      const res = await vehicleService.getVehicleTypesDropdown()
      if (res.data.status) vehicleTypes.value = res.data.data
    } catch (err) {
      console.error('Error fetching vehicle types:', err)
    }
  }

  return {
    vehicleTypes,
    fetchVehicleTypes
  }
}
