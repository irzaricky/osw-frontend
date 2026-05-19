<script setup lang="ts">
import { computed } from 'vue'
import type { POStatus, POPriority } from '../../../../types/production-plan/order-schedule'

const props = defineProps<{
  search: string
  filters: {
    status?:    string
    priority?:  string
    date_from?: string
    date_to?:   string
  }
}>()

const emit = defineEmits<{
  'update:search':  [value: string]
  'update:filters': [value: typeof props.filters]
}>()

const statusItems: POStatus[][] = [['Draft', 'Released', 'In_Progress', 'Completed', 'Closed', 'Rejected', 'Cancelled']]
const priorityItems: POPriority[][] = [['Low', 'Medium', 'High', 'Critical']]

const statusLabel: Record<string, string> = {
  Draft:       'Draft',
  Released:    'Released',
  In_Progress: 'In Progress',
  Completed:   'Completed',
  Closed:      'Closed',
  Rejected:    'Rejected',
  Cancelled:   'Cancelled',
}

const selectedStatus = computed({
  get: () => props.filters.status ?? null,
  set: (v) => emit('update:filters', { ...props.filters, status: v ?? undefined }),
})

const selectedPriority = computed({
  get: () => props.filters.priority ?? null,
  set: (v) => emit('update:filters', { ...props.filters, priority: v ?? undefined }),
})

const selectedDateFrom = computed({
  get: () => props.filters.date_from ?? null,
  set: (v) => emit('update:filters', { ...props.filters, date_from: v ?? undefined }),
})

const selectedDateTo = computed({
  get: () => props.filters.date_to ?? null,
  set: (v) => emit('update:filters', { ...props.filters, date_to: v ?? undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedStatus"
      :items="statusItems"
      placeholder="PO Status"
      class="w-44"
      clear
    />
    <USelectMenu
      v-model="selectedPriority"
      :items="priorityItems"
      placeholder="Priority"
      class="w-36"
      clear
    />
    <UInput
      v-model="selectedDateFrom"
      type="date"
      placeholder="Start from"
      class="w-40"
    />
    <UInput
      v-model="selectedDateTo"
      type="date"
      placeholder="Start to"
      class="w-40"
    />
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search PO..."
      class="w-64 ml-auto"
      @update:model-value="emit('update:search', $event)"
    />
  </div>
</template>