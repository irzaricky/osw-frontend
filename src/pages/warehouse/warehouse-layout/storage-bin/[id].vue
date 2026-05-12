<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'

import { useWarehouseLayoutStore } from '../../../../stores/warehouse/warehouse-layout.store'
import { useStorageBinColumns } from '../composables/useStorageBinColumns'

import Breadcrumbs from '../../../../components/Breadcrumbs.vue'
import StorageBinFilters from '../components/StorageBinFilters.vue'

// Store
const warehouseLayoutStore = useWarehouseLayoutStore()
const { storageBinDetail, storageBinMeta, loading } = storeToRefs(warehouseLayoutStore)

const route = useRoute()
const rowSelection = ref({})

// Pagination
const pagination = computed(() => ({
  page: storageBinMeta.value.page,
  limit: storageBinMeta.value.limit
}))

// Breadcrumbs
const breadcrumbItems =   computed(() => {
  if (!storageBinDetail.value) {
    return [
      { label: 'Home', to: '/' },
      { label: 'Warehouse' },
      { label: 'Warehouse Layout', to: '/warehouse/warehouse-layout' },
    ]
  }

  return [
    { label: 'Home', to: '/' },
    { label: 'Warehouse' },
    { label: 'Warehouse Layout', to: '/warehouse/warehouse-layout' },
    { label: storageBinDetail.value.bin.area.warehouse.warehouse_code, to: `/warehouse/warehouse-layout/${route.params.layoutId}` },
    { label: storageBinDetail.value.bin.bin_code }
  ]
})

// State
const search = ref('')

// Columns
const { columns } = useStorageBinColumns(pagination)

// Fetch data
async function fetchData() {
  const params: Record<string, any> = {
    page: storageBinMeta.value.page,
    limit: storageBinMeta.value.limit,
    search: search.value
  }
  
  await warehouseLayoutStore.fetchStorageBinDetail(route.params.id as string, params)
}

// Filter handlers
function onUpdateSearch(value: string) {
  search.value = value
}

// Watchers
const debouncedFetch = useDebounceFn(() => {
  storageBinMeta.value.page = 1
  fetchData()
}, 300)
watch(search, () => debouncedFetch())

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- BREADCRUMB -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- HEADER -->
    <div class="flex justify-between items-center">
      <div class="space-y-1">
        <template v-if="loading">
          <USkeleton class="h-8 w-48" />
          <USkeleton class="h-4 w-64" />
        </template>

        <template v-else>
          <h1 class="text-2xl font-bold">
            {{ storageBinDetail?.bin.bin_code }}
          </h1>

          <p class="text-sm text-muted">
            {{ storageBinDetail?.bin.area.area_code }} • {{ storageBinDetail?.bin.area.name }}
          </p>
        </template>
      </div>
    </div>

    <!-- SUMMARY -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <template v-if="loading">
        <USkeleton class="h-28 w-full rounded-xl" />
        <USkeleton class="h-28 w-full rounded-xl" />
      </template>

      <template v-else>
        <UCard>
          <div class="space-y-1">
            <p class="text-sm text-muted">
              Capacity
            </p>
            <p class="text-3xl font-bold">
              {{ storageBinDetail?.stocks.count }}/{{ storageBinDetail?.bin.capacity }}
            </p>
          </div>
        </UCard>

        <UCard>
          <div class="flex flex-col gap-2">
            <p class="text-sm text-muted">
              Bin Type
            </p>

            <!-- FREE -->
            <template v-if="!storageBinDetail?.bin.dedicated_part_number">
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-green-500" />
                <p class="text-2xl font-bold">
                  FREE
                </p>
              </div>

              <p class="text-sm text-muted">
                Can store any part
              </p>
            </template>

            <!-- DEDICATED -->
            <template v-else>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded-full bg-amber-400" />
                <p class="text-2xl font-bold">
                  DEDICATED
                </p>
              </div>

              <p class="text-sm text-muted">
                {{ storageBinDetail?.bin.dedicated_part_number }}
              </p>
            </template>
          </div>
        </UCard>
      </template>
    </div>

    <!-- FILTER -->
    <StorageBinFilters
      :search="search"
      @update:search="onUpdateSearch"
    />

    <!-- TABLE -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="loading ? [] : storageBinDetail?.stocks.rows || []"
      :columns="columns"
      :loading="loading"
      class="w-full"
    />

    <!-- PAGINATION -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ storageBinMeta.total }} stock(s).
      </div>
      <UPagination
        v-model:page="storageBinMeta.page"
        :total="storageBinMeta.total"
        :items-per-page="storageBinMeta.limit"
        @update:page="fetchData"
      />
    </div>
  </div>
</template>