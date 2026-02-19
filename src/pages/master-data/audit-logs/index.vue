<script setup lang="ts">
import { ref, reactive, onMounted, watch, resolveComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useAuditLogStore } from '../../../stores/master-data/audit-log.store'
import { useAppToast } from '../../../composables/useAppToast'
import { useLogDropdowns } from './composables/useLogDropdowns'
import { useLogColumns } from './composables/useLogColumns'
import type { AuditLog } from '../../../types/master-data/audit-log'

import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import LogFilters from './components/LogFilters.vue'
import LogDetailModal from './components/LogDetailModal.vue'

// Store
const logStore = useAuditLogStore()
const { logs, meta, loading } = storeToRefs(logStore)
const { toastError } = useAppToast()
const route = useRoute()
const router = useRouter()

// Header / Breadcrumbs
const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Master Data' },
  { label: 'Audit Logs' }
]

// Dropdowns
const { modules, activities, users: userOptions, fetchDropdowns } = useLogDropdowns()

// Filters
const search = ref((route.query.search as string) || '')
const filters = reactive({
  start_date: (route.query.start_date as string) || undefined,
  end_date: (route.query.end_date as string) || undefined,
  module_id: route.query.module_id ? Number(route.query.module_id) : undefined,
  activity_id: route.query.activity_id ? Number(route.query.activity_id) : undefined,
  user_id: route.query.user_id ? Number(route.query.user_id) : undefined
})

// Modal
const isDetailOpen = ref(false)
const selectedLog = ref<AuditLog | null>(null)

// Resolve components
const uiComponents = {
  UBadge: resolveComponent('UBadge'),
  UButton: resolveComponent('UButton')
}

// Columns
const { columns } = useLogColumns({
  onViewDetail: handleViewDetail
}, uiComponents)

// Methods
async function fetchData() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit,
    search: search.value,
  }

  if (filters.start_date) params.start_date = filters.start_date
  if (filters.end_date) params.end_date = filters.end_date
  if (filters.module_id) params.module_id = filters.module_id
  if (filters.activity_id) params.activity_id = filters.activity_id
  if (filters.user_id) params.user_id = filters.user_id

  await logStore.fetchLogs(params)
}

function handleViewDetail(row: AuditLog) {
  selectedLog.value = row
  isDetailOpen.value = true
}

async function handleExport() {
  try {
     const params: Record<string, any> = {
      search: search.value,
      ...filters
    }
    const blob = await logStore.downloadLogs(params)
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'audit_logs.xlsx') 
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    toastError(err)
  }
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

// Sync state to URL
watch([search, filters], () => {
  const query: Record<string, any> = { ...route.query }
  
  if (search.value) query.search = search.value
  else delete query.search

  if (filters.start_date) query.start_date = filters.start_date
  else delete query.start_date

  if (filters.end_date) query.end_date = filters.end_date
  else delete query.end_date

  if (filters.module_id) query.module_id = filters.module_id
  else delete query.module_id

  if (filters.activity_id) query.activity_id = filters.activity_id
  else delete query.activity_id

  if (filters.user_id) query.user_id = filters.user_id
  else delete query.user_id

  router.replace({ query })
}, { deep: true })

// Lifecycle
onMounted(() => {
  fetchData()
  fetchDropdowns()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <Breadcrumbs :items="breadcrumbItems" />

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
    </div>

    <!-- Filters -->
    <LogFilters 
      :search="search"
      :filters="filters"
      :modules="modules"
      :activities="activities"
      :users="userOptions"
      @update:search="search = $event"
      @update:filters="Object.assign(filters, $event)"
    />

    <!-- Actions -->
    <div class="flex gap-2">
      <UButton 
        icon="i-lucide-download" 
        color="neutral" 
        variant="ghost" 
        label="Export" 
        @click="handleExport" 
      />
    </div>

    <!-- Table -->
    <UTable
      :data="logs" 
      :columns="columns" 
      :loading="loading"
      class="w-full"
    />

    <!-- Pagination -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
      <div class="text-sm text-muted">
        Total {{ meta.total }} logs
      </div>
      <UPagination 
        v-model:page="meta.page" 
        :total="meta.total"
        :items-per-page="meta.limit"
        @update:page="fetchData"
      />
    </div>

    <!-- Detail Modal -->
    <LogDetailModal
      v-model:open="isDetailOpen"
      :old-data="selectedLog?.old_data ?? null"
      :new-data="selectedLog?.new_data ?? null"
    />
  </div>
</template>
