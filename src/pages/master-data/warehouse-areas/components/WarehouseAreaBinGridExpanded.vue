<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WarehouseArea } from '../../../../types'
import warehouseBinService, { type WarehouseBin } from '../../../../services/master-data/warehouse-bin.service'
import WarehouseAreaBinGrid from './WarehouseAreaBinGrid.vue'

const props = defineProps<{
  area: WarehouseArea
}>()

const loading = ref(false)
const bins = ref<WarehouseBin[]>([])

async function fetchBins() {
  if (!props.area?.id) return

  loading.value = true
  try {
    const limit = Number(props.area.total_rows || 0) * Number(props.area.total_cols || 0) || 1000

    const res = await warehouseBinService.list({
      page: 1,
      limit,
      area_id: props.area.id
    })

    if (res.data?.status) {
      bins.value = res.data.data?.rows || []
    } else {
      bins.value = []
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => props.area?.id,
  () => fetchBins(),
  { immediate: true }
)
</script>

<template>
  <div>
    <div v-if="loading" class="py-4 text-sm text-muted">
      Loading bins...
    </div>
    <WarehouseAreaBinGrid v-else :area="props.area" :bins="bins" />
  </div>
</template>