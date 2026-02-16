<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { useUserStore } from '../../../stores/master-data/user.store'
import { useUserDropdowns } from './composables/useUserDropdowns'
import { useUserColumns } from './composables/useUserColumns'
import { useAppToast } from '../../../composables/useAppToast'
import type { User } from '../../../types'
import type { Row } from '@tanstack/table-core'

import UserFilters from './components/UserFilters.vue'
import UserBulkActions from './components/UserBulkActions.vue'
import UserFormModal from './components/UserFormModal.vue'

// Store
const userStore = useUserStore()
const { users, meta, loading, error } = storeToRefs(userStore)
const { toastSuccess, toastError } = useAppToast()
const table = useTemplateRef('table')

// Resolve components in setup context (required for render functions in composable)
const uiComponents = {
  UCheckbox: resolveComponent('UCheckbox'),
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton'),
  UDropdownMenu: resolveComponent('UDropdownMenu')
}



// State
const search = ref('')
const filters = reactive({
  role_id: undefined as number | undefined,
  division_id: undefined as number | undefined,
  factory_id: undefined as number | undefined,
  line_id: undefined as number | undefined,
  active: undefined as string | undefined
})

// Dropdowns (shared composable)
const modalFactoryId = ref<number | undefined>(undefined)
const { roles, divisions, factories, lines, fetchDropdowns, fetchLines } = useUserDropdowns(modalFactoryId)

// Modal state
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
function createEmptyUser(): Partial<User> {
  return {
    id: undefined,
    email: '',
    password: '',
    role_id: undefined,
    full_name: '',
    phone_number: '',
    factory_id: undefined,
    line_id: undefined,
    active: true
  }
}

const currentUser = reactive<Partial<User>>(createEmptyUser())

// Table state
const rowSelection = ref({})
const expanded = ref({})

// Columns (composable)
const { columns } = useUserColumns({
  onEdit: openEditModal,
  onDelete: handleDelete,
  onToggleStatus: handleStatusToggle
}, uiComponents)

// Computed
const selectedCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0
})

// --- Data Fetching ---
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value
  }
  if (filters.role_id) params.role_id = filters.role_id
  if (filters.division_id) params.division_id = filters.division_id
  if (filters.factory_id !== undefined) params.factory_id = filters.factory_id
  if (filters.line_id) params.line_id = filters.line_id
  if (filters.active !== undefined && filters.active !== 'all') params.active = filters.active

  await userStore.fetchUsers(params)
}

// --- Modal Handlers ---
function openAddModal() {
  modalMode.value = 'add'
  Object.assign(currentUser, createEmptyUser())
  modalFactoryId.value = undefined
  isModalOpen.value = true
}

function openEditModal(user: User) {
  modalMode.value = 'edit'
  Object.assign(currentUser, {
    id: user.id,
    email: user.email,
    password: '',
    role_id: user.role_id,
    active: user.active,
    full_name: user.user_detail?.full_name || '',
    phone_number: user.user_detail?.phone_number || '',
    factory_id: user.user_detail?.factory_id,
    line_id: user.user_detail?.line_id
  })
  modalFactoryId.value = user.user_detail?.factory_id
  isModalOpen.value = true
}

async function handleSave(data: Partial<User>) {
  try {
    let message = ''
    const { active, employee_number, id, ...payload } = data

    if (modalMode.value === 'add') {
      const res = await userStore.createUser(payload)
      message = res.message || 'User created'
    } else {
      if (!payload.password) delete payload.password
      const res = await userStore.updateUser(data.id!, payload)
      message = res.message || 'User updated'
    }
    toastSuccess(message)
    isModalOpen.value = false
    fetchData()
  } catch (err: any) {
    toastError(err)
  }
}

// --- Row Actions ---
async function handleStatusToggle(row: User) {
  try {
    const res = await userStore.updateUserStatus(row.id, !row.active)
    toastSuccess(res.message || `User ${row.active ? 'activated' : 'deactivated'}`)
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

async function handleDelete(row: User) {
  if (!confirm('Are you sure you want to delete this user?')) return
  try {
    const res = await userStore.deleteUser(row.id)
    toastSuccess(res.message || 'User deleted')
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

async function handleBulkDelete() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (!selectedRows.length) return
  if (!confirm(`Are you sure you want to delete ${selectedRows.length} users?`)) return
  try {
    await Promise.all(selectedRows.map((row: Row<User>) => userStore.deleteUser(row.original.id)))
    rowSelection.value = {}
    rowSelection.value = {}
    toastSuccess(`${selectedRows.length} users deleted`)
    fetchData()
  } catch (err) {
    toastError(err)
  }
}

async function handleExport() {
  try {
    const params: Record<string, any> = {
      search: search.value
    }
    if (filters.role_id) params.role_id = filters.role_id
    if (filters.division_id) params.division_id = filters.division_id
    if (filters.factory_id !== undefined) params.factory_id = filters.factory_id
    if (filters.line_id) params.line_id = filters.line_id
    if (filters.active !== undefined && filters.active !== 'all') params.active = filters.active

    const blob = await userStore.downloadUsers(params)
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'users.xlsx') 
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    toastError(err)
  }
}

// --- Filter Handlers ---
function onUpdateSearch(value: string) {
  search.value = value
}

function onUpdateFilters(partial: Record<string, any>) {
  Object.assign(filters, partial)
  if ('factory_id' in partial) {
    filters.line_id = undefined
    if (partial.factory_id) fetchLines(partial.factory_id)
    else lines.value = []
  }
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

// --- Lifecycle ---
onMounted(() => {
  fetchData()
  fetchDropdowns()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
    </div>

    <UserFilters 
      :search="search"
      :filters="filters"
      :roles="roles"
      :divisions="divisions"
      :factories="factories"
      :lines="lines"
      @update:search="onUpdateSearch"
      @update:filters="onUpdateFilters"
    />

    <!-- Actions -->
    <div class="flex gap-2">
      <UButton 
        icon="i-lucide-download" 
        color="neutral" 
        variant="ghost" 
        label="Export" 
        size="lg"
        @click="handleExport" 
      />
      <UButton 
        icon="i-lucide-plus" 
        color="primary" 
        variant="solid" 
        label="Add User" 
        @click="openAddModal" 
      />
    </div>

    <!-- Bulk Actions -->
    <UserBulkActions 
      :count="selectedCount"
      @delete="handleBulkDelete"
    />

    <!-- Table -->
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      v-model:expanded="expanded"
      :data="users" 
      :columns="columns" 
      :loading="loading"
      class="w-full"
    >
      <template #expanded="{ row }">
        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-elevated/50 border-b border-default">
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">Personal Details</h4>
            <p class="text-sm"><span class="text-muted">Full Name:</span> {{ row.original.user_detail?.full_name || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Employee Number:</span> {{ row.original.user_detail?.employee_number || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Phone:</span> {{ row.original.user_detail?.phone_number || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Email:</span> {{ row.original.email || '-' }}</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">Work Information</h4>
            <p class="text-sm"><span class="text-muted">Division:</span> {{ row.original.role?.division?.name || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Factory:</span> {{ row.original.user_detail?.factory?.name || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Line:</span> {{ row.original.user_detail?.line?.name || '-' }}</p>
          </div>
          <div class="space-y-1">
            <h4 class="font-semibold text-sm text-highlighted">Account Info</h4>
            <p class="text-sm"><span class="text-muted">Role:</span> {{ row.original.role?.name || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Created:</span> {{ row.original.createdAt || '-' }}</p>
            <p class="text-sm"><span class="text-muted">Updated:</span> {{ row.original.updatedAt || '-' }}</p>
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
    
    <!-- Modal -->
    <UserFormModal
      v-model:open="isModalOpen"
      :mode="modalMode"
      :user="currentUser"
      :roles="roles"
      :factories="factories"
      :lines="lines"
      :loading="loading"
      @save="handleSave"
      @update:factory-id="(id) => modalFactoryId = id"
    />
  </div>
</template>
