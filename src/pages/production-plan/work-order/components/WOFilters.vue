<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrderStatus } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  search:  string
  filters: {
    status?:    WorkOrderStatus
    work_date?: string
    line_id?:   number
  }
}>()

const emit = defineEmits<{
  'update:search':  [value: string]
  'update:filters': [value: typeof props.filters]
  'reset':          []
}>()

const statusItems = ['Draft', 'Released', 'In_Progress', 'Completed', 'Cancelled'] as WorkOrderStatus[]

const statusLabel: Record<WorkOrderStatus, string> = {
  Draft:       'Draft',
  Released:    'Released',
  In_Progress: 'In Progress',
  Completed:   'Completed',
  Cancelled:   'Cancelled',
}

const selectedStatus = computed({
  get: () => props.filters.status ?? null,
  set: (v) => emit('update:filters', { ...props.filters, status: v ?? undefined }),
})

const selectedDate = computed({
  get: () => props.filters.work_date ?? '',
  set: (v) => emit('update:filters', { ...props.filters, work_date: v || undefined }),
})

const hasActiveFilters = computed(() =>
  !!props.search || !!props.filters.status || !!props.filters.work_date,
)
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedStatus"
      :items="statusItems"
      placeholder="All Statuses"
      class="w-44"
      clear
    />

    <UInput
      v-model="selectedDate"
      type="date"
      icon="i-lucide-calendar"
      placeholder="Work Date"
      class="w-48"
    />

    <div class="ml-auto flex items-center gap-2">
      <UButton
        v-if="hasActiveFilters"
        label="Reset"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="emit('reset')"
      />
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search WO number..."
        class="w-64"
        @update:model-value="emit('update:search', $event)"
      />
    </div>
  </div>
</template>