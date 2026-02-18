<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useVehicleStore } from '../../../stores/master-data/vehicle.store'
import { useVehicleDropdowns } from './composables/useVehicleDropdowns'
import { useVehicleColumns } from './composables/useVehicleColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Vehicle, VehicleType } from '../../../types'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import VehicleFilters from './components/VehicleFilters.vue'
import VehicleBulkActions from './components/VehicleBulkActions.vue'
import VehicleFormModal from './components/VehicleFormModal.vue'
import VehicleTypeFormModal from './components/VehicleTypeFormModal.vue'

// Store
const vehicleStore = useVehicleStore()
const { vehicles, vehicleTypes, meta, loading } = storeToRefs(vehicleStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef('table')

// Resolve components in setup context (required for render functions in composable)
const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox'),
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Vehicles' }
]

// Tabs
const selectedTab = ref('0')
const tabs = [
  { label: 'Vehicles', slot: 'vehicles' },
  { label: 'Vehicle Types', slot: 'vehicle-types' }
]

// State - Vehicles
const search = ref('')
const filters = reactive({
  vehicle_type_id: undefined as number | undefined,
  active: undefined as string | undefined
})

// Dropdowns (shared composable)
const { vehicleTypes: vehicleTypesDropdown, fetchVehicleTypes } = useVehicleDropdowns()

// Modal state - Vehicles
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
function createEmptyVehicle(): Partial<Vehicle> {
  return {
    id: undefined,
    vehicle_code: '',
    plate_number: '',
    vehicle_type_id: undefined,
    image: undefined,
    status: true
  }
}

const currentVehicle = reactive<Partial<Vehicle>>(createEmptyVehicle())

// Modal state - Vehicle Types
const isTypeModalOpen = ref(false)
const typeModalMode = ref<'add' | 'edit'>('add')
function createEmptyVehicleType(): Partial<VehicleType> {
  return {
    id: undefined,
    name: '',
    load_capacity: 0
  }
}

const currentVehicleType = reactive<Partial<VehicleType>>(createEmptyVehicleType())

// Confirm dialog state
const confirmDialog = reactive({
  open: false,
  title: '',
  description: '',
  action: null as (() => Promise<void>) | null
})

// Table state
const rowSelection = ref({})
const expanded = ref({})

// Columns (composable)
const { columns } = useVehicleColumns({
  onEdit: openEditModal,
  onDelete: handleDelete,
  onToggleStatus: handleStatusToggle
}, uiComponents)

// Computed
const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// --- Data Fetching - Vehicles ---
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.vehicle_type_id) params.vehicle_type_id = filters.vehicle_type_id
  if (filters.active !== undefined && filters.active !== 'all') params.active = filters.active

  await vehicleStore.fetchVehicles(params)
}

// --- Modal Handlers - Vehicles ---
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentVehicle, createEmptyVehicle())
  isModalOpen.value = true
}

function openEditModal(vehicle: Vehicle) {
  modalMode.value = 'edit'
  Object.assign(currentVehicle, {
    id: vehicle.id,
    vehicle_code: vehicle.vehicle_code,
    plate_number: vehicle.plate_number,
    vehicle_type_id: vehicle.vehicle_type?.id,
    image: vehicle.image,
    status: vehicle.status ?? vehicle.active
  })
  isModalOpen.value = true
}

async function handleSave(formData: FormData) {
  try {
    let message = ''
    
    if (modalMode.value === 'add') {
      const res = await vehicleStore.createVehicle(formData)
      message = res.message || 'Vehicle created'
    } else {
      const res = await vehicleStore.updateVehicle(currentVehicle.id!, formData)
      message = res.message || 'Vehicle updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// --- Row Actions - Vehicles ---
async function handleStatusToggle(row: Vehicle) {
  try {
    const formData = new FormData()
    formData.append('vehicle_code', row.vehicle_code)
    formData.append('plate_number', row.plate_number)
    const vehicleTypeId = row.vehicle_type?.id || row.vehicle_type_id
    if (vehicleTypeId) {
      formData.append('vehicle_type_id', vehicleTypeId.toString())
    }
    
    formData.append('status', (!(row.status ?? row.active)).toString())
    
    const res = await vehicleStore.updateVehicle(row.id, formData)
    toastSuccess(res.message || `Vehicle ${row.status ?? row.active ? 'deactivated' : 'activated'}`)
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

async function handleDelete(row: Vehicle) {
  confirmDialog.title = 'Delete Vehicle'
  confirmDialog.description = `Are you sure you want to delete vehicle "${row.vehicle_code}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await vehicleStore.deleteVehicle(row.id)
      toastSuccess(res.message || 'Vehicle deleted')
      fetchData()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

async function handleBulkDelete() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!selectedRows.length) return
  
  confirmDialog.title = 'Delete Multiple Vehicles'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} vehicle(s)? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      await Promise.all(selectedRows.map((row: Row<Vehicle>) => vehicleStore.deleteVehicle(row.original.id)))
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} vehicles deleted`)
      fetchData()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

// --- Filter Handlers ---
function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

// --- Watchers ---
const debouncedFetch = useDebounceFn(() => {
  meta.value.page = 1
  fetchData()
}, 300)

watch(search, () => debouncedFetch())
watch(filters, () => {
  meta.value.page = 1
  fetchData()
}, { deep: true })

// --- Vehicle Types Management ---
function openAddTypeModal() {
  typeModalMode.value = 'add'
  Object.assign(currentVehicleType, createEmptyVehicleType())
  isTypeModalOpen.value = true
}

function openEditTypeModal(vehicleType: VehicleType) {
  typeModalMode.value = 'edit'
  Object.assign(currentVehicleType, {
    id: vehicleType.id,
    name: vehicleType.name,
    load_capacity: vehicleType.load_capacity
  })
  isTypeModalOpen.value = true
}

async function handleTypeSave(data: Partial<VehicleType>) {
  try {
    let message = ''
    
    if (typeModalMode.value === 'add') {
      const res = await vehicleStore.createVehicleType(data)
      message = res.message || 'Vehicle type created'
    } else {
      const res = await vehicleStore.updateVehicleType(currentVehicleType.id!, data)
      message = res.message || 'Vehicle type updated'
    }
    toastSuccess(message)
    isTypeModalOpen.value = false
    await vehicleStore.fetchVehicleTypes()
    await fetchVehicleTypes() // Refresh dropdown
  } catch (err: any) {
    toastError(err)
  }
}

async function handleTypeDelete(vehicleType: VehicleType) {
  confirmDialog.title = 'Delete Vehicle Type'
  confirmDialog.description = `Are you sure you want to delete vehicle type "${vehicleType.name}"? This action cannot be undone.`
  confirmDialog.action = async () => {
    try {
      const res = await vehicleStore.deleteVehicleType(vehicleType.id)
      toastSuccess(res.message || 'Vehicle type deleted')
      await vehicleStore.fetchVehicleTypes()
      await fetchVehicleTypes()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

// --- Lifecycle ---
onMounted(() => {
  fetchData()
  fetchVehicleTypes()
  vehicleStore.fetchVehicleTypes()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Management</h1>
    </div>


    <!-- Tabs -->
    <UTabs v-model="selectedTab" variant="link" :items="tabs" class="w-full">
      <!-- Vehicles Tab -->
      <template #vehicles>
        <div class="space-y-6 pt-4">
          <VehicleFilters 
            :search="search"
            :filters="filters"
            :vehicle-types="vehicleTypesDropdown"
            @update:search="onUpdateSearch"
            @update:filters="onUpdateFilters"
          />

          <!-- Actions -->
          <div class="flex gap-2">
            <UButton 
              icon="i-lucide-plus" 
              color="primary" 
              variant="solid" 
              label="Add Vehicle" 
              @click="openAddModal" 
            />
          </div>

          <!-- Bulk Actions -->
          <VehicleBulkActions 
            :count="selectedCount"
            @delete="handleBulkDelete"
          />

          <!-- Table -->
          <UTable
            ref="table"
            v-model:row-selection="rowSelection"
            v-model:expanded="expanded"
            :data="vehicles" 
            :columns="columns" 
            :loading="loading"
            class="w-full"
          >
            <template #expanded="{ row }">
              <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
                <div class="space-y-1">
                  <h4 class="font-semibold text-sm text-highlighted">Vehicle Details</h4>
                  <p class="text-sm"><span class="text-muted">Code:</span> {{ row.original.vehicle_code || '-' }}</p>
                  <p class="text-sm"><span class="text-muted">Plate:</span> {{ row.original.plate_number || '-' }}</p>
                  <p class="text-sm"><span class="text-muted">Type:</span> {{ row.original.vehicle_type?.name || '-' }}</p>
                </div>
                <div class="space-y-1">
                  <h4 class="font-semibold text-sm text-highlighted">Specifications</h4>
                  <p class="text-sm"><span class="text-muted">Load Capacity:</span> {{ row.original.vehicle_type?.load_capacity ?? '-' }}</p>
                </div>
                <div v-if="row.original.image" class="space-y-1">
                  <h4 class="font-semibold text-sm text-highlighted">Image</h4>
                  <img :src="row.original.image" alt="Vehicle" class="w-32 h-32 object-cover rounded-lg border border-default" />
                </div>
              </div>
            </template>
          </UTable>
          
          <!-- Pagination -->
          <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
            <div class="text-sm text-muted">
              {{ selectedCount }} of {{ meta.total }} row(s) selected.
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

      <!-- Vehicle Types Tab -->
      <template #vehicle-types>
        <div class="space-y-6 pt-4">
          <!-- Actions -->
          <div class="flex gap-2">
            <UButton 
              icon="i-lucide-plus" 
              color="primary" 
              variant="solid" 
              label="Add Vehicle Type" 
              @click="openAddTypeModal" 
            />
          </div>

          <!-- Vehicle Types Table -->
          <div class="border border-default rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-elevated border-b border-default">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold">Load Capacity (kg)</th>
                  <th class="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading" class="border-b border-default">
                  <td colspan="4" class="px-4 py-8 text-center text-muted">Loading...</td>
                </tr>
                <tr v-else-if="!vehicleTypes.length" class="border-b border-default">
                  <td colspan="4" class="px-4 py-8 text-center text-muted">No vehicle types found</td>
                </tr>
                <tr v-else v-for="vt in vehicleTypes" :key="vt.id" class="border-b border-default hover:bg-elevated/50">
                  <td class="px-4 py-3 text-sm">{{ vt.id }}</td>
                  <td class="px-4 py-3 text-sm">{{ vt.name }}</td>
                  <td class="px-4 py-3 text-sm">{{ vt.load_capacity.toLocaleString() }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex gap-2 justify-end">
                      <UButton 
                        icon="i-lucide-edit" 
                        color="neutral" 
                        variant="ghost" 
                        size="sm"
                        @click="openEditTypeModal(vt)" 
                      />
                      <UButton 
                        icon="i-lucide-trash-2" 
                        color="error" 
                        variant="ghost" 
                        size="sm"
                        @click="handleTypeDelete(vt)" 
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </UTabs>
    
    <!-- Vehicle Modal -->
    <VehicleFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :vehicle="currentVehicle"
      :vehicle-types="vehicleTypesDropdown"
      :loading="loading"
      @save="handleSave"
    />

    <!-- Vehicle Type Modal -->
    <VehicleTypeFormModal
      v-model:open="isTypeModalOpen"
      :mode="typeModalMode"
      :vehicle-type="currentVehicleType"
      :loading="loading"
      @save="handleTypeSave"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model:open="confirmDialog.open"
      :title="confirmDialog.title"
      :description="confirmDialog.description"
      confirm-label="Delete"
      :loading="loading"
      @confirm="confirmDialog.action?.()"
    />
  </div>
</template>
