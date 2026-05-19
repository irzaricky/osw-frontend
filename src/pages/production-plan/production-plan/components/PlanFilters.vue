<script setup lang="ts">
import type { PlanStatus, OverallStatus } from '../../../../types/production-plan/plan'

const props = defineProps<{
  search: string
  filters: {
    status?: string
    overall_status?: string
  }
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: typeof props.filters]
}>()

const planStatusItems = [['Draft', 'Pending_Approval', 'Approved', 'Rejected']]
const overallStatusItems = [['Not_Calculated', 'POSSIBLE', 'IMPOSSIBLE']]

const planStatusLabel: Record<string, string> = {
  Draft: 'Draft',
  Pending_Approval: 'Pending Approval',
  Approved: 'Approved',
  Rejected: 'Rejected',
}

import { computed } from 'vue'

const selectedStatus = computed({
  get: () => props.filters.status ?? null,
  set: (v) => emit('update:filters', { ...props.filters, status: v ?? undefined }),
})

const selectedOverallStatus = computed({
  get: () => props.filters.overall_status ?? null,
  set: (v) => emit('update:filters', { ...props.filters, overall_status: v ?? undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedStatus"
      :items="planStatusItems"
      placeholder="Plan Status"
      class="w-44"
      clear
    />
    <USelectMenu
      v-model="selectedOverallStatus"
      :items="overallStatusItems"
      placeholder="Capacity Status"
      class="w-44"
      clear
    />
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search plans..."
      class="w-64 ml-auto"
      @update:model-value="emit('update:search', $event)"
    />
  </div>
</template>