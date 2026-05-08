<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { usePlacementStore } from '../../../stores/warehouse/placement.store'
import PlacementFilters from './components/PlacementFilters.vue'
import PlacementCard from './components/PlacementCard.vue'
import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'


const router = useRouter()

const placementStore = usePlacementStore()

const warehouseAreaStore = useWarehouseAreaStore()
const { dropdown: warehouseAreas } = storeToRefs(warehouseAreaStore)

const { placements, meta, loading, workOrderTypes } = storeToRefs(placementStore)

const search = ref('')

const filters = reactive({
  warehouse_area_id: undefined as number | undefined,
  wo_status_id: undefined as number | undefined,
  wo_type_id: undefined as number | undefined,
  wo_date_start: undefined as string | undefined,
  wo_date_end: undefined as string | undefined
})

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Placement' }
]

async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }

  if (filters.warehouse_area_id) params.warehouse_area_id = filters.warehouse_area_id
  if (filters.wo_status_id) params.wo_status_id = filters.wo_status_id
  if (filters.wo_type_id) params.wo_type_id = filters.wo_type_id
  if (filters.wo_date_start) params.wo_date_start = filters.wo_date_start
  if (filters.wo_date_end) params.wo_date_end = filters.wo_date_end

  await placementStore.fetchPlacements(params)
}

function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

function resetFilters() {
  search.value = ''
  filters.warehouse_area_id = undefined
  filters.wo_status_id = undefined
  filters.wo_type_id = undefined
  filters.wo_date_start = undefined
  filters.wo_date_end = undefined
  meta.value.page = 1
  fetchData()
}

function openDetail(id: number) {
  router.push(`/warehouse/placement/${id}`)
}

const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())

watch(filters, () => {
  meta.value.page = 1
  fetchData()
}, { deep: true })

onMounted(() => {
  fetchData()
  warehouseAreaStore.fetchDropdown()
  placementStore.fetchWorkOrderTypes()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div>
      <h1 class="text-2xl font-bold">
        Stock In Placement
      </h1>
      <p class="text-sm text-muted">
        Search work order, validate part label, and place into storage bin.
      </p>
    </div>

    <PlacementFilters
      :search="search"
      :filters="filters"
      :warehouse-areas="warehouseAreas"
      :work-order-types="workOrderTypes"
      @update:search="onUpdateSearch"
      @update:filters="onUpdateFilters"
      @reset="resetFilters"
    />

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <USkeleton v-for="i in 6" :key="i" class="h-64 rounded-xl" />
    </div>

    <div v-else-if="placements.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <PlacementCard
        v-for="placement in placements"
        :key="placement.wo_id"
        :placement="placement"
        @detail="openDetail"
      />
    </div>

    <UCard v-else>
      <div class="py-10 text-center text-muted">
        No work order placement found.
      </div>
    </UCard>

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} work order(s)
      </div>

      <UPagination
        v-model:page="meta.page"
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>
  </div>
</template>