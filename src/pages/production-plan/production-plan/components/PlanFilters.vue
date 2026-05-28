<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  search:     string
  filters: {
    status?:         string
    overall_status?: string
    plan_month?:     string
    plan_type?:      string
  }
}>()

const emit = defineEmits<{
  (e: 'update:search', val: string): void
  (e: 'update:filters', val: Partial<typeof props.filters>): void
}>()

const statusOptions = [
  { label: 'All Status', value: undefined },
  { label: 'Draft', value: 'Draft' },
  { label: 'Pending Approval', value: 'Pending_Approval' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
]

const overallStatusOptions = [
  { label: 'All Capacity', value: undefined },
  { label: 'Not Calculated', value: 'Not_Calculated' },
  { label: 'Possible', value: 'POSSIBLE' },
  { label: 'Impossible', value: 'IMPOSSIBLE' },
]

// [~] value disesuaikan dengan enum BE: 'ORIGINAL' | 'AMENDMENT'
const planTypeOptions = [
  { label: 'All Types', value: undefined },
  { label: 'Original', value: 'ORIGINAL' },
  { label: 'Amendment', value: 'AMENDMENT' },
]

// Generate opsi bulan: bulan ini sampai 11 bulan ke belakang + 3 bulan ke depan
const planMonthOptions = computed(() => {
  const options: { label: string; value: string | undefined }[] = [
    { label: 'All Months', value: undefined },
  ]
  const now = new Date()
  for (let i = -11; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    options.push({ label, value })
  }
  // Urutkan terbaru di atas (index 1 = terbaru, karena index 0 = "All Months")
  options.splice(1, options.length - 1, ...options.slice(1).reverse())
  return options
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <!-- Search -->
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search plan number or description..."
      class="w-64"
      @update:model-value="emit('update:search', $event as string)"
    />

    <!-- Filter Plan Month -->
    <USelect
      :model-value="filters.plan_month"
      :items="planMonthOptions"
      value-key="value"
      label-key="label"
      placeholder="All Months"
      class="w-44"
      @update:model-value="emit('update:filters', { ...filters, plan_month: $event || undefined })"
    />

    <!-- Filter Plan Type -->
    <USelect
      :model-value="filters.plan_type"
      :items="planTypeOptions"
      value-key="value"
      label-key="label"
      placeholder="All Types"
      class="w-40"
      @update:model-value="emit('update:filters', { ...filters, plan_type: $event || undefined })"
    />

    <!-- Filter Status -->
    <USelect
      :model-value="filters.status"
      :items="statusOptions"
      value-key="value"
      label-key="label"
      placeholder="All Status"
      class="w-40"
      @update:model-value="emit('update:filters', { ...filters, status: $event || undefined })"
    />

    <!-- Filter Capacity -->
    <USelect
      :model-value="filters.overall_status"
      :items="overallStatusOptions"
      value-key="value"
      label-key="label"
      placeholder="All Capacity"
      class="w-40"
      @update:model-value="emit('update:filters', { ...filters, overall_status: $event || undefined })"
    />
  </div>
</template>