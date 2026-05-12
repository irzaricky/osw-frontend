<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useRouter } from 'vue-router'

import WarehouseLayoutCard from './components/WarehouseLayoutCard.vue'
import WarehouseLayoutFormModal from './components/WarehouseLayoutFormModal.vue'
import WarehouseLayoutFilters from './components/WarehouseLayoutFilters.vue'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'

import { useWarehouseLayoutStore } from '../../../stores/warehouse/warehouse-layout.store'
import { useWarehouseStore } from '../../../stores/master-data/warehouse.store'

import { useAppToast } from '../../../composables/useAppToast'

import type { WarehouseLayout } from '../../../types/warehouse/warehouse-layout'

// Store
const warehouseLayoutStore = useWarehouseLayoutStore()
const warehouseStore = useWarehouseStore()

const { layouts, meta, loading } = storeToRefs(warehouseLayoutStore)
const { dropdown: warehouses } = storeToRefs(warehouseStore)

const { toastSuccess, toastError } = useAppToast()

const router = useRouter()

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Warehouse Layout' }
]

// State
const isModalOpen = ref(false)
const search = ref('')

// Methods
function openAddModal() {
  isModalOpen.value = true
}

function handleDetail(id: number) {
  router.push(`/warehouse/warehouse-layout/${id}`)
}

function onUpdateSearch(value: string) {
  search.value = value
}

const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => {
  debouncedFetch()
})

async function handleSave(data: Partial<WarehouseLayout>) {
  try {
    const res = await warehouseLayoutStore.createLayout({
      warehouse_id: data.warehouse_id as number
    })
    const message = res?.message || 'Warehouse layout created successfully'
    toastSuccess(message)
    isModalOpen.value = false
    await fetchData()
  } catch (err) {
    toastError(err)
  }
}

async function fetchData() {
  try {
    const params: Record<string, any> = {
      page: meta.value.page,
      limit: meta.value.limit,
      search: search.value,
    }

    await warehouseLayoutStore.fetchLayouts(params)
  }
  catch (error) {
    console.error(error)
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchData(),
    warehouseStore.fetchDropdown({
      exclude_has_layout: true
    }),
  ])
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">
          Warehouse Layout
        </h1>
      </div>

      <UButton
        color="primary"
        icon="i-lucide-plus"
        variant="solid"
        label="Add Warehouse Layout"
        @click="openAddModal"
      />
    </div>

    <WarehouseLayoutFilters
      :search="search"
      @update:search="onUpdateSearch"
    />

    <div
      v-if="loading"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-64 rounded-xl"
      />
    </div>

    <UCard
      v-else-if="layouts.length === 0"
      class="py-12"
    >
      <div class="flex flex-col items-center justify-center text-center">
        <UIcon
          name="i-lucide-warehouse"
          class="size-12 text-muted mb-4"
        />

        <h3 class="text-lg font-semibold">
          No Warehouse Layout
        </h3>

        <p class="text-sm text-muted">
          Add warehouse layout to start configuration
        </p>
      </div>
    </UCard>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <WarehouseLayoutCard
        v-for="layout in layouts"
        :key="layout.id"
        :warehouse-layout="layout"
        @detail="handleDetail"
      />
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} warehouse layout(s).
      </div>

      <UPagination v-model:page="meta.page" :total="meta.total" :items-per-page="meta.limit" @update:page="fetchData" />
    </div>

    <WarehouseLayoutFormModal
      v-model:open="isModalOpen"
      :loading="loading"
      :warehouses="warehouses"
      @save="handleSave"
    />
  </div>
</template>