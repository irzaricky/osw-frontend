<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import { useMaterialReceivingStore } from '../../../stores/warehouse/material-receiving.store'
import { useMaterialReceivingColumns } from './composables/useMaterialReceivingColumns'

import type { Range } from '../../../types'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import MaterialReceivingFilters from './components/MaterialReceivingFilters.vue'
import { MaterialReceiving } from '../../../types/warehouse/material-receiving'

// Store
const materialReceivingStore = useMaterialReceivingStore()
const { materialReceivings, materialReceivingStatuses, meta, loading } = storeToRefs(materialReceivingStore)

const router = useRouter()

const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

const pagination = computed(() => ({
  page: meta.value.page,
  limit: meta.value.limit
}))

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Material Receiving' }
]

// State
const search = ref('')
const filters = reactive({
  status: undefined as any,
  date_range: undefined as Range | undefined
})

// Combined statuses
const combinedStatuses = computed(() => [
  {
    id: 'in transit',
    name: 'In Transit',
    type: 'mdo'
  },
  ...materialReceivingStatuses.value.map((status: any) => ({
    id: status.id,
    name: status.name,
    type: 'mr'
  }))
])

// Table state
const rowSelection = ref({})

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Columns
const { columns } = useMaterialReceivingColumns({
  onProcess: handleProcess,
  onViewProgress: () => {}
}, uiComponents, pagination)

// Fetch data
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.status) {
    if (filters.status.type === 'mdo') {
      params.status = 'in transit'
    } else {
      params.status_id = filters.status.id
    }
  }
  if (filters.date_range?.start) params.start_date = formatLocalDate(filters.date_range.start)
  if (filters.date_range?.end) params.end_date = formatLocalDate(filters.date_range.end)

  await materialReceivingStore.fetchMaterialReceivings(params)
}

// Filter handlers
function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

function handleProcess(row: MaterialReceiving) {
  router.push(`/warehouse/material-receiving/set-arrived-process/${row.id}`)
}

// Watchers
const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())
watch(filters, () => {
  meta.value.page = 1
  fetchData()
}, { deep: true })

// Lifecycle
onMounted(() => {
  fetchData()
  materialReceivingStore.fetchMaterialReceivingStatusesDropdown()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">
        Material Receiving & Unloading
      </h1>
    </div>

    <MaterialReceivingFilters
      :search="search"
      :filters="filters"
      :statuses="combinedStatuses"
      @update:filters="onUpdateFilters"
      @update:search="onUpdateSearch"
    />

    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="loading ? [] : materialReceivings"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} delivery order(s).
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