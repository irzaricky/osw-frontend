<script setup lang="ts">
import { computed } from 'vue'

interface Filters {
  status?:         string
  overall_status?: string
  plan_month?:     string
  plan_type?:      string
}

const props = defineProps<{
  search:  string
  filters: Filters
}>()

const emit = defineEmits<{
  'update:search':  [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const statusItems = [
  { label: 'Draft',            value: 'Draft' },
  { label: 'Pending Approval', value: 'Pending_Approval' },
  { label: 'Approved',         value: 'Approved' },
  { label: 'Rejected',         value: 'Rejected' },
]

const overallStatusItems = [
  { label: 'Not Calculated', value: 'Not_Calculated' },
  { label: 'Possible',       value: 'POSSIBLE' },
  { label: 'Impossible',     value: 'IMPOSSIBLE' },
]

const planTypeItems = [
  { label: 'Original',  value: 'ORIGINAL' },
  { label: 'Amendment', value: 'AMENDMENT' },
]

const planMonthItems = computed(() => {
  const items: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = -11; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    items.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })
  }
  return items.reverse()
})

// ── Computed setters — pola identik dengan BOM ────────────────────────────────
const selectedPlanMonth = computed({
  get: () => props.filters.plan_month,
  set: (v) => emit('update:filters', { ...props.filters, plan_month: v ?? undefined }),
})

const selectedPlanType = computed({
  get: () => props.filters.plan_type,
  set: (v) => emit('update:filters', { ...props.filters, plan_type: v ?? undefined }),
})

const selectedStatus = computed({
  get: () => props.filters.status,
  set: (v) => emit('update:filters', { ...props.filters, status: v ?? undefined }),
})

const selectedOverallStatus = computed({
  get: () => props.filters.overall_status,
  set: (v) => emit('update:filters', { ...props.filters, overall_status: v ?? undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Filter Plan Month -->
    <USelectMenu
      v-model="selectedPlanMonth"
      :items="planMonthItems"
      value-key="value"
      label-key="label"
      placeholder="All Months"
      class="w-44"
      clear
    />

    <!-- Filter Plan Type -->
    <USelectMenu
      v-model="selectedPlanType"
      :items="planTypeItems"
      value-key="value"
      label-key="label"
      placeholder="All Types"
      class="w-40"
      clear
    />

    <!-- Filter Status -->
    <USelectMenu
      v-model="selectedStatus"
      :items="statusItems"
      value-key="value"
      label-key="label"
      placeholder="All Status"
      class="w-40"
      clear
    />

    <!-- Filter Capacity -->
    <USelectMenu
      v-model="selectedOverallStatus"
      :items="overallStatusItems"
      value-key="value"
      label-key="label"
      placeholder="All Capacity"
      class="w-40"
      clear
    />

    <!-- Search -->
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search plan number or description..."
      class="w-64 ml-auto"
      @update:model-value="emit('update:search', String($event))"
    />
  </div>
</template>