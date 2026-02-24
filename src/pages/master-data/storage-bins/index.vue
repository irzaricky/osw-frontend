<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'

import StorageBinFilters from './components/StorageBinFilters.vue'
import StorageBinGrid from './components/StorageBinGrid.vue'
import StorageBinAssignModal from './components/StorageBinAssignModal.vue'

import { useAppToast } from '../../../composables/useAppToast'
import { useWarehouseStore } from '../../../stores/master-data/warehouse.store'
import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'
import { usePartStore } from '../../../stores/master-data/part.store'

import warehouseBinService, { type WarehouseBin } from '../../../services/master-data/warehouse-bin.service'
import type { WarehouseArea } from '../../../types'

type Option = { label: string; value: number | undefined }

// Toast
const { toastSuccess, toastError } = useAppToast()

// Stores
const warehouseStore = useWarehouseStore()
const areaStore = useWarehouseAreaStore()
const partStore = usePartStore()

const { warehouses } = storeToRefs(warehouseStore)
const { areas, loading: areaLoading } = storeToRefs(areaStore)
const { parts, loading: partLoading } = storeToRefs(partStore)

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Storage Bins' }
]

// Filter states
const selectedWarehouse = ref<Option | undefined>(undefined)
const selectedArea = ref<Option | undefined>(undefined)

// Data bins
const bins = ref<WarehouseBin[]>([])
const binsLoading = ref(false)

// Modal assign
const isAssignOpen = ref(false)
const activeBin = ref<WarehouseBin | null>(null)
const assignLoading = ref(false)

// Confirm
const confirmDialog = ref({
  open: false,
  title: '',
  description: '',
  action: null as null | (() => Promise<void>)
})

// Warehouse dropdown items
const warehouseItems = computed<Option[]>(() => [
  { label: 'All Warehouse', value: undefined },
  ...(warehouses.value || []).map((w: any) => ({ label: w.name, value: w.id }))
])

// Area dropdown items (from store areas)
const areaItems = computed<Option[]>(() => [
  { label: 'Select Area', value: undefined },
  ...(areas.value || []).map((a: any) => ({
    label: `${a.area_code} — ${a.name}`,
    value: a.id
  }))
])

// Selected area object
const selectedAreaObj = computed<WarehouseArea | undefined>(() => {
  if (!selectedArea.value?.value) return undefined
  return (areas.value || []).find((a: any) => a.id === selectedArea.value!.value)
})

// Category auto from warehouse selected
const warehouseCategoryName = computed(() => {
  const id = selectedWarehouse.value?.value
  if (!id) return '-'
  const found = (warehouses.value || []).find((w: any) => w.id === id)
  return found?.category?.name || '-'
})

async function fetchAreasByWarehouse() {
  const warehouseId = selectedWarehouse.value?.value
  // reset area selection
  selectedArea.value = undefined
  bins.value = []

  if (!warehouseId) return

  await areaStore.fetchAreas({ page: 1, limit: 200, warehouse_id: warehouseId })
}

async function fetchBinsByArea() {
  const areaId = selectedArea.value?.value
  bins.value = []

  if (!areaId) return

  try {
    binsLoading.value = true

    const res = await warehouseBinService.list({
      page: 1,
      limit: 2000,
      area_id: areaId
    })

    if (res.data?.status) {
      bins.value = res.data.data?.rows || []
    } else {
      toastError(res.data?.message || 'Failed to fetch bins')
    }
  } catch (err: any) {
    toastError(err?.response?.data?.message || err?.message || err)
  } finally {
    binsLoading.value = false
  }
}

function onClickBin(bin: WarehouseBin) {
  activeBin.value = bin
  isAssignOpen.value = true
}

// Save assign (set part + capacity)
async function handleSaveAssign(payload: { dedicated_part_number: string; capacity: number }) {
  if (!activeBin.value) return

  confirmDialog.value = {
    open: true,
    title: 'Assign Bin',
    description: `Assign part to bin "${activeBin.value.bin_code}"?`,
    action: async () => {
      try {
        assignLoading.value = true
        const res = await warehouseBinService.update(activeBin.value!.id, {
          is_dedicated: true,
          dedicated_part_number: payload.dedicated_part_number,
          capacity: payload.capacity
        })

        toastSuccess(res.data?.message || 'Bin updated')
        isAssignOpen.value = false
        await fetchBinsByArea()
      } catch (err: any) {
        toastError(err?.response?.data?.message || err?.message || err)
      } finally {
        assignLoading.value = false
        confirmDialog.value.open = false
      }
    }
  }
}

// Clear bin (delete assignment)
async function handleClearAssign() {
  if (!activeBin.value) return

  confirmDialog.value = {
    open: true,
    title: 'Clear Bin',
    description: `Remove assigned part from bin "${activeBin.value.bin_code}"?`,
    action: async () => {
      try {
        assignLoading.value = true
        const res = await warehouseBinService.update(activeBin.value!.id, {
          is_dedicated: false,
          dedicated_part_number: null,
          capacity: 0
        })

        toastSuccess(res.data?.message || 'Bin cleared')
        isAssignOpen.value = false
        await fetchBinsByArea()
      } catch (err: any) {
        toastError(err?.response?.data?.message || err?.message || err)
      } finally {
        assignLoading.value = false
        confirmDialog.value.open = false
      }
    }
  }
}

// Watchers
watch(
  () => selectedWarehouse.value?.value,
  () => {
    fetchAreasByWarehouse()
  }
)

const debouncedAreaFetch = useDebounceFn(() => {
  fetchBinsByArea()
}, 150)

watch(
  () => selectedArea.value?.value,
  () => debouncedAreaFetch()
)

watch(
  () => selectedArea.value?.value,
  async (areaId) => {
    if (!areaId) return

    try {
      await partStore.fetchPartsDropdown()
    } catch (err: any) {
      toastError(err?.response?.data?.message || err?.message || err)
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(async () => {
  await warehouseStore.fetchWarehouses({ page: 1, limit: 200 })
})

</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Storage Bin</h1>
    </div>

    <StorageBinFilters :warehouse-items="warehouseItems" :area-items="areaItems" :selected-warehouse="selectedWarehouse"
      :selected-area="selectedArea" :warehouse-category-name="warehouseCategoryName"
      @update:warehouse="selectedWarehouse = $event" @update:area="selectedArea = $event" />

    <div v-if="!selectedWarehouse?.value" class="text-sm text-muted">
      Select warehouse first.
    </div>

    <div v-else-if="areaLoading" class="text-sm text-muted">
      Loading areas...
    </div>

    <div v-else-if="!selectedArea?.value" class="text-sm text-muted">
      Select area to show bin grid.
    </div>

    <div v-else>
      <StorageBinGrid :total-cols="Number(selectedAreaObj?.total_cols || 0)"
        :total-rows="Number(selectedAreaObj?.total_rows || 0)" :bins="bins" :loading="binsLoading"
        @click-bin="onClickBin" />
    </div>

    <StorageBinAssignModal v-model:open="isAssignOpen" :bin="activeBin" :parts="parts"
      :loading="assignLoading || partLoading" @save="handleSaveAssign" @clear="handleClearAssign" />

    <ConfirmDialog v-model:open="confirmDialog.open" :title="confirmDialog.title"
      :description="confirmDialog.description" confirm-label="Yes" :loading="assignLoading"
      @confirm="confirmDialog.action?.()" />
  </div>
</template>