<script setup lang="ts">
import { computed } from 'vue'
import type { POStatus } from '../../../../types/production-plan/order-schedule'
import { poStatusLabel } from '../composables/usePOUtils'

interface Filters {
  status:  POStatus | undefined
  plan_id: number | undefined
}

const props = defineProps<{
  search:        string
  filters:       Filters
  statusOptions: POStatus[]
}>()

const emit = defineEmits<{
  'update:search':  [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const statusItems = computed(() =>
  [props.statusOptions.map(s => ({ label: poStatusLabel[s], value: s }))]
)

const selectedStatus = computed({
  get() {
    if (!props.filters.status) return undefined
    return { label: poStatusLabel[props.filters.status], value: props.filters.status }
  },
  set(item: { label: string; value: POStatus } | undefined) {
    emit('update:filters', { status: item?.value ?? undefined })
  },
})

function updateFilter(key: keyof Filters, value: any) {
  emit('update:filters', { [key]: value })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedStatus"
      :items="statusItems"
      value-attribute="value"
      option-attribute="label"
      placeholder="Filter by Status"
      class="w-full md:w-48"
      clear
    />

    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search PO Number or Plan..."
      class="w-full md:w-72"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>