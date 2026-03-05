<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useDefectStore } from '../../../stores/master-data/defect.store'
import { useDefectColumns } from './composables/useDefectColumns'
import { useDefectCategoryColumns } from './composables/useDefectCategoryColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { Defect, DefectCategory } from '../../../types/master-data/defect'
import type { Row } from '@tanstack/table-core'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import ConfirmDialog from '../../../components/ConfirmDialog.vue'
import DefectFilters from './components/DefectFilters.vue'
import DefectBulkActions from './components/DefectBulkActions.vue'
import DefectFormModal from './components/DefectFormModal.vue'
import DefectCategoryFormModal from './components/DefectCategoryFormModal.vue'

// Store
const defectStore = useDefectStore()
const { defects, defectCategories, defectMeta, defectCategoryMeta, loading } = storeToRefs(defectStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef<any>('table')

const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox'),
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}

const defectPagination = computed(() => ({
  page: defectMeta.value.page,
  limit: defectMeta.value.limit
}))

const defectCategoryPagination = computed(() => ({
  page: defectCategoryMeta.value.page,
  limit: defectCategoryMeta.value.limit
}))

// Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Defects' }
]

// Tabs
const selectedTab = ref('0')
const tabs = [
  { label: 'Defects', slot: 'defects' },
  { label: 'Defect Categories', slot: 'defect-categories' }
]

// State - Defects
const search = ref('')
const filters = reactive({
  defect_category_id: undefined as number | undefined,
})

// Modal state - Defects
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
function createEmptyDefect(): Partial<Defect> {
  return {
    id: undefined,
    name: '',
    defect_category_id: undefined,
    description: ''
  }
}

const currentDefect = reactive<Partial<Defect>>(createEmptyDefect())

// Modal state - Defect Categories
const isCategoryModalOpen = ref(false)
const categoryModalMode = ref<'add' | 'edit'>('add')
function createEmptyDefectCategory(): Partial<DefectCategory> {
  return {
    id: undefined,
    name: '',
    description: ''
  }
}

const currentDefectCategory = reactive<Partial<DefectCategory>>(createEmptyDefectCategory())

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
const { columns } = useDefectColumns({
  onEdit: openEditModal,
  onDelete: handleDelete,
}, uiComponents, defectPagination)

const { columns: categoryColumns } = useDefectCategoryColumns({
  onEdit: openEditCategoryModal,
  onDelete: handleCategoryDelete
}, uiComponents, defectCategoryPagination)

// Computed
const selectedCount = computed(() => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// Data fetching - Defects
async function fetchDefects() {
  const params: Record<string, any> = {
    page: defectMeta.value.page,
    limit: defectMeta.value.limit,
    search: search.value
  }
  if (filters.defect_category_id) params.defect_category_id = filters.defect_category_id

  await defectStore.fetchDefects(params)
}

// Modal handlers - Defects
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentDefect, createEmptyDefect())
  isModalOpen.value = true
}

function openEditModal(defect: Defect) {
  modalMode.value = 'edit'
  Object.assign(currentDefect, {
    id: defect.id,
    name: defect.name,
    defect_category_id: defect.category?.id,
    description: defect.description
  })
  isModalOpen.value = true
}

async function handleSave(data: Partial<Defect>) {
  try {
    let message = ''
    
    if (modalMode.value === 'add') {
      const res = await defectStore.createDefect(data)
      message = res.message || 'Defect created successfully'
    } else {
      const res = await defectStore.updateDefect(currentDefect.id!, data)
      message = res.message || 'Defect updated successfully'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchDefects()
  } catch (err: any) {
    toastError(err)
  }
}

async function handleDelete(row: Defect) {
  confirmDialog.title = 'Delete Defect'
  confirmDialog.description = `Are you sure you want to delete defect "${row.name}"?`
  confirmDialog.action = async () => {
    try {
      const res = await defectStore.deleteDefect(row.id)
      toastSuccess(res.message || 'Warehouse deleted successfully')
      fetchDefects()
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

  confirmDialog.title = 'Delete Multiple Defects'
  confirmDialog.description = `Are you sure you want to delete ${selectedRows.length} defect(s)?`

  confirmDialog.action = async () => {
    try {
      await Promise.all(
        selectedRows.map((row: Row<Defect>) =>
          defectStore.deleteDefect(row.original.id)
        )
      )
      rowSelection.value = {}
      toastSuccess(`${selectedRows.length} defects deleted successfully`)
      fetchDefects()
      confirmDialog.open = false
    } catch (err) {
      toastError(err)
      confirmDialog.open = false
    }
  }
  confirmDialog.open = true
}

// Filter Handlers
function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
}

// Watchers
const debouncedFetch = useDebounceFn(() => {
  defectMeta.value.page = 1
  fetchDefects()
}, 300)

watch(search, () => debouncedFetch())
watch(filters, () => {
  defectMeta.value.page = 1
  fetchDefects()
}, { deep: true })

// Data fetching - Defects
async function fetchDefectCategories() {
  const params: Record<string, any> = {
    page: defectCategoryMeta.value.page,
    limit: defectCategoryMeta.value.limit
  }

  await defectStore.fetchDefectCategories(params)
}

// Modal handlers - Defect Categories
function openAddCategoryModal() {
  categoryModalMode.value = 'add'
  Object.assign(currentDefectCategory, createEmptyDefectCategory())
  isCategoryModalOpen.value = true
}

function openEditCategoryModal(defectCategory: DefectCategory) {
  categoryModalMode.value = 'edit'
  Object.assign(currentDefectCategory, {
    id: defectCategory.id,
    name: defectCategory.name,
    description: defectCategory.description
  })
  isCategoryModalOpen.value = true
}

async function handleCategorySave(data: Partial<DefectCategory>) {
  try {
    let message = ''
    
    if (categoryModalMode.value === 'add') {
      const res = await defectStore.createDefectCategory(data)
      message = res.message || 'Defect category created successfully'
    } else {
      const res = await defectStore.updateDefectCategory(currentDefectCategory.id!, data)
      message = res.message || 'Defect category updated successfully'
    }
    toastSuccess(message)
    isCategoryModalOpen.value = false
    await fetchDefectCategories()
    await defectStore.fetchDefectCategoriesDropdown() // Refresh dropdown
  } catch (err: any) {
    toastError(err)
  }
}

async function handleCategoryDelete(defectCategory: DefectCategory) {
  confirmDialog.title = 'Delete Defect Category'
  confirmDialog.description = `Are you sure you want to delete defect category "${defectCategory.name}"?`
  confirmDialog.action = async () => {
    try {
      const res = await defectStore.deleteDefectCategory(defectCategory.id)
      toastSuccess(res.message || 'Defect Category deleted successfully')
      await fetchDefectCategories()
      await defectStore.fetchDefectCategoriesDropdown() // Refresh dropdown
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
  fetchDefects()
  fetchDefectCategories()
  defectStore.fetchDefectCategoriesDropdown()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Defect Management
      </h1>
    </div>

    <UTabs
      v-model="selectedTab"
      variant="link"
      :items="tabs"
      class="w-full"
    >
      <template #defects>
        <div class="space-y-6 pt-4">
          <DefectFilters 
            :search="search"
            :filters="filters"
            :defect-categories="defectCategories"
            @update:search="onUpdateSearch"
            @update:filters="onUpdateFilters"
          />

          <div class="flex gap-2">
            <UButton
              icon="i-lucide-plus"
              color="primary"
              variant="solid"
              label="Add Defect"
              @click="openAddModal"
            />
          </div>

          <DefectBulkActions 
            :count="selectedCount"
            @delete="handleBulkDelete"
          />

          <UTable
            ref="table"
            v-model:row-selection="rowSelection"
            v-model:expanded="expanded"
            :data="loading ? [] : defects" 
            :columns="columns" 
            :loading="loading"
            class="w-full"
          >
            <template #expanded="{ row }">
              <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
                <div class="space-y-1">
                  <h4 class="font-semibold text-sm text-highlighted">
                    Defect Details
                  </h4>
                  <p class="text-sm wrap-break-word whitespace-normal">
                    <span class="text-muted">Defect Name:</span> {{ row.original.name || '-' }}
                  </p>
                  <p class="text-sm wrap-break-word whitespace-normal">
                    <span class="text-muted">Defect Category:</span> {{ row.original.category?.name || '-' }}
                  </p>
                  <p class="text-sm wrap-break-word whitespace-normal">
                    <span class="text-muted">Description:</span> {{ row.original.description || '-' }}
                  </p>
                </div>
                <div class="space-y-1">
                  <h4 class="font-semibold text-sm text-highlighted">
                    System Info
                  </h4>
                  <p class="text-sm wrap-break-word whitespace-normal">
                    <span class="text-muted">Created:</span> {{ row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-' }}
                  </p>
                  <p class="text-sm wrap-break-word whitespace-normal">
                    <span class="text-muted">Updated:</span> {{ row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : '-' }}
                  </p>
                </div>
              </div>
            </template>
          </UTable>

          <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
            <div class="text-sm text-muted">
              {{ selectedCount }} of {{ defectMeta.total }} row(s) selected.
            </div>
            <UPagination 
              v-model:page="defectMeta.page" 
              :total="defectMeta.total"
              :items-per-page="defectMeta.limit"
              @update:page="fetchDefects"
            />
          </div>
        </div>
      </template>

      <template #defect-categories>
        <div class="space-y-6 pt-4">
          <div class="flex gap-2">
            <UButton 
              icon="i-lucide-plus" 
              color="primary" 
              variant="solid" 
              label="Add Defect Category" 
              @click="openAddCategoryModal" 
            />
          </div>

          <UTable
            ref="table"
            v-model:row-selection="rowSelection"
            :data="loading ? [] : defectCategories" 
            :columns="categoryColumns" 
            :loading="loading"
            class="w-full"
          />

          <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
            <div class="text-sm text-muted">
              {{ defectCategoryMeta.total }} defect categories.
            </div>
            <UPagination 
              v-model:page="defectCategoryMeta.page" 
              :total="defectCategoryMeta.total"
              :items-per-page="defectCategoryMeta.limit"
              @update:page="fetchDefectCategories"
            />
          </div>
        </div>
      </template>
    </UTabs>

    <DefectFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :defect="currentDefect"
      :categories="defectCategories"
      :loading="loading"
      @save="handleSave"
    />

    <DefectCategoryFormModal
      v-model:open="isCategoryModalOpen"
      :mode="categoryModalMode"
      :category="currentDefectCategory"
      :loading="loading"
      @save="handleCategorySave"
    />

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