<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import { useBufferStatusStore } from '../../../../stores/production/buffer-status.store'

import BufferStatusFilters from './components/BufferStatusFilters.vue'
import BufferStatusTable from './components/BufferStatusTable.vue'

const store = useBufferStatusStore()
const { bufferStatus, meta, loading } = storeToRefs(store)

const search = ref('')

const filters = reactive({
  station_id: undefined as number | undefined,
  status: undefined as string | undefined
})

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Production' },
  { label: 'Production Material Control' },
  { label: 'Buffer Status' }
]

async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }

  if (filters.station_id) params.station_id = filters.station_id
  if (filters.status) params.status = filters.status

  await store.fetchBufferStatus(params)
}

function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

function resetFilters() {
  search.value = ''
  filters.station_id = undefined
  filters.status = undefined
  meta.value.page = 1
  fetchData()
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

onMounted(fetchData)
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div>
      <h1 class="text-2xl font-bold">
        Buffer Status
      </h1>
      <p class="text-sm text-muted">
        Monitor production station buffer, aging, and replenishment needs.
      </p>
    </div>

    <BufferStatusFilters
      :search="search"
      :filters="filters"
      @update:search="onUpdateSearch"
      @update:filters="onUpdateFilters"
      @reset="resetFilters"
    />

    <BufferStatusTable
      :data="bufferStatus"
      :loading="loading"
      :page="meta.page"
      :limit="meta.limit"
    />

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} buffer item(s)
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