<script setup lang="ts">
import { computed, onMounted, ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'

import WarehouseLayoutCanvas from './components/WarehouseLayoutCanvas.vue'
import WarehouseLayoutSidebar from './components/WarehouseLayoutSidebar.vue'

import { useWarehouseLayoutStore } from '../../../stores/warehouse/warehouse-layout.store'
import { useWarehouseAreaStore } from '../../../stores/master-data/warehouse-area.store'

import { useAppToast } from '../../../composables/useAppToast'
import type { AreaLayout, AreaSpacing, AreaLayoutPayload } from '../../../types/warehouse/warehouse-layout'

const route = useRoute()

const warehouseLayoutStore = useWarehouseLayoutStore()
const warehouseAreaStore = useWarehouseAreaStore()
const { layoutDetail, loading } = storeToRefs(warehouseLayoutStore)
const { dropdown: warehouseAreas } = storeToRefs(warehouseAreaStore)

const { toastSuccess, toastError } = useAppToast()

const layoutId = computed(() => Number(route.params.id))
const panelMode = ref<'info' | 'add-area' | 'edit-area'>('info')
const selectedAreaLayoutId = ref< number | null >(null)
const selectedAreaLayout = ref<AreaLayout | null>(null)

// Confirm delete
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (
    (() => Promise<void>)
    | null
  )
})

// Preview state
const isPreviewColliding = ref(false)

function handleCollisionChange(
  value: boolean
) {
  isPreviewColliding.value = value
}

const previewArea = ref<{
  area_id: number
  area_code: string
  name: string
  total_rows: number
  total_cols: number
  start_row: number
  start_col: number
  area_spacings?: AreaSpacing[]
} | null>(null)

// Breadcrumb
const breadcrumbItems = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Warehouse' },
  { label: 'Warehouse Layout', to: '/warehouse/warehouse-layout' },
  { label: layoutDetail.value?.warehouse?.name || `Layout #${layoutId.value}` }
])

// Fetch warehouse layout detail
async function fetchDetail() {
  await warehouseLayoutStore.fetchLayout(
    layoutId.value
  )
}

// Sidebar area
function openAddArea() {
  selectedAreaLayoutId.value = null
  previewArea.value = null
  panelMode.value = 'add-area'
}

async function openEditArea(areaLayoutId: number) {
  try {
    selectedAreaLayoutId.value = areaLayoutId

    const found =
      layoutDetail.value?.area_layouts.find(
      area =>
        area.id === areaLayoutId
    )

    if (!found) return

    selectedAreaLayout.value = found

    previewArea.value = {
      area_id: found.area_id,
      area_code:
        found.area?.area_code || '',
      name:
        found.area?.name || '',
      total_rows:
        found.area?.total_rows || 0,
      total_cols:
        found.area?.total_cols || 0,
      start_row: found.start_row,
      start_col: found.start_col,
      area_spacings:
        found.area_spacings || [],
    }

    panelMode.value = 'edit-area'
  }
  catch (err) {
    toastError(err)
  }
}

function closePanel() {
  panelMode.value = 'info'
  selectedAreaLayoutId.value = null
  previewArea.value = null
}

// Handle preview change
function handlePreviewChange(
  data: {
    area_id: number
    start_row: number
    start_col: number
    area_spacings?: AreaSpacing[]
  } | null
) {
  if (!data) {
    previewArea.value = null
    return
  }

  const selectedArea = warehouseAreas.value.find(
    area => area.id === data.area_id
  )

  if (!selectedArea) {
    previewArea.value = null
    return
  }

  previewArea.value = {
    area_id: selectedArea.id,
    area_code: selectedArea.area_code,
    name: selectedArea.name,
    total_rows: selectedArea.total_rows,
    total_cols: selectedArea.total_cols,
    start_row: data.start_row,
    start_col: data.start_col,
    area_spacings: data.area_spacings || [],
  }
}

async function handleSaveArea(data: Partial<AreaLayoutPayload>) {
  try {
    let payload

    if (panelMode.value === 'add-area') {
      payload = {
        area_id: data.area_id,
        start_row: data.start_row,
        start_col: data.start_col,
        area_spacings:
          (
            data.area_spacings || []
          ).map(spacing => ({
            col_index:
              spacing.col_index,

            col_spacing:
              spacing.col_spacing,
          })),
      }
    } else {
      payload = {
        start_row: data.start_row,
        start_col: data.start_col,
        area_spacings:
          (
            data.area_spacings || []
          ).map(spacing => ({
            col_index:
              spacing.col_index,

            col_spacing:
              spacing.col_spacing,
          })),
      }
    }

    let res

    if (panelMode.value === 'add-area') {
      res = await warehouseLayoutStore.addAreaLayout(layoutId.value, payload)
    } else if (panelMode.value === 'edit-area' && selectedAreaLayoutId.value) {
      res = await warehouseLayoutStore.updateAreaLayout(selectedAreaLayoutId.value, layoutId.value, payload)
    }

    const message = res?.message || 'Area layout saved successfully'
    toastSuccess(message)
    await fetchDetail()
    closePanel()
  }
  catch (err) {
    toastError(err)
  }
}

async function handleDeleteArea(areaLayoutId: number) {
  const selectedArea = layoutDetail.value?.area_layouts.find(
    area => area.id === areaLayoutId
  )

  confirmDialog.title = 'Delete Area Layout'
  confirmDialog.description = `Are you sure you want to delete area layout for area "${selectedArea?.area?.area_code || '-'}"?`

  confirmDialog.action = async () => {
    try {
      const res = await warehouseLayoutStore.deleteAreaLayout(areaLayoutId, layoutId.value)
      const message = res?.message || 'Area layout deleted successfully'
      toastSuccess(message)
      await fetchDetail()
      closePanel()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }

  confirmDialog.open = true
}

// Lifecycle
onMounted(async () => {
  await fetchDetail()
  const warehouseId = layoutDetail.value?.warehouse?.id
  if (warehouseId) {
    await warehouseAreaStore.fetchDropdown({
      warehouse_id: warehouseId
    })
  }
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- BREADCRUMB -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- HEADER -->
    <div
      class="
        flex
        flex-col
        gap-4
        md:flex-row
        md:items-center
        md:justify-between
      "
    >
      <div>
        <h1 class="text-2xl font-bold">
          Warehouse Layout Editor
        </h1>

        <p class="text-sm text-muted">
          Manage warehouse area positioning and layout configuration.
        </p>
      </div>

      <div>
        <UButton
          v-if="panelMode === 'info'"
          icon="i-lucide-plus"
          label="Add Area Layout"
          color="primary"
          @click="openAddArea"
        />

        <UButton
          v-else
          icon="i-lucide-x"
          label="Cancel"
          color="neutral"
          variant="soft"
          @click="closePanel"
        />
      </div>
    </div>

    <!-- LOADING -->
    <div
      v-if="loading"
      class="
        grid
        grid-cols-1
        gap-6
        xl:grid-cols-4
      "
    >
      <USkeleton
        class="
          h-[700px]
          rounded-xl
          xl:col-span-3
        "
      />

      <USkeleton
        class="h-[700px] rounded-xl"
      />
    </div>

    <!-- CONTENT -->
    <div
      v-else-if="layoutDetail"
      class="
        grid
        grid-cols-1
        gap-6
        xl:grid-cols-4
      "
    >
      <!-- CANVAS -->
      <div class="xl:col-span-3">
        <WarehouseLayoutCanvas
          :layout="layoutDetail"
          :preview-area="previewArea"
          :selected-area-layout-id="selectedAreaLayoutId"
          @collision-change="handleCollisionChange"
          @select-area="openEditArea"
        />
      </div>

      <!-- SIDEBAR -->
      <WarehouseLayoutSidebar
        :layout="layoutDetail"
        :panel-mode="panelMode"
        :warehouse-areas="warehouseAreas"
        :is-colliding="isPreviewColliding"
        :area-layout-detail="selectedAreaLayout"
        @cancel-add-area="closePanel"
        @preview-change="handlePreviewChange"
        @save="handleSaveArea"
        @delete="handleDeleteArea"
      />
    </div>

    <!-- EMPTY -->
    <UCard v-else>
      <div
        class="
          py-10
          text-center
          text-muted
        "
      >
        Warehouse layout detail not found.
      </div>
    </UCard>
  </div>

  <ConfirmDialog
    v-model:open="confirmDialog.open"
    :title="confirmDialog.title"
    :description="confirmDialog.description"
    confirm-label="Delete"
    :loading="loading"
    @confirm="confirmDialog.action?.()"
  />
</template>