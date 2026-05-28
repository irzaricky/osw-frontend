<script setup lang="ts">
import { computed } from 'vue'

interface GoodReceiptStatus {
  id: number
  name: string
}

interface Filters {
  status: GoodReceiptStatus | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const statuses: GoodReceiptStatus[] = [
  {
    id: 4,
    name: 'Waiting GR Approval'
  },
  {
    id: 5,
    name: 'Good Receipt'
  }
]

const statusItems = computed(() => 
  statuses.map(s => s.name)
)

const selectedStatus = computed({
  get() {
    return props.filters.status?.name
  },

  set(value: string | undefined) {
    if (!value) {
      updateFilter('status', undefined)
      return
    }

    const found = statuses.find(
      s => s.name === value
    )

    updateFilter('status', found)
  }
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
      placeholder="Filter by Status"
      class="w-full md:w-52"
      clear
    />

    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search MPO/MDO Number"
      class="w-full md:w-72 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>