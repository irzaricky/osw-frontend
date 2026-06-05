<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownPart, DropdownSupplier } from '../../../../types/warehouse/warranty-and-claim'

interface Filters {
  category: string | undefined
  part: DropdownPart | undefined
  supplier: DropdownSupplier | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  parts: DropdownPart[]
  suppliers: DropdownSupplier[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const categories = ['Quantity', 'Quality']

const categoryItems = computed(() => categories)
const partItems = computed(() => props.parts.map(part => `${part.part_number} - ${part.part_name}`))
const supplierItems = computed(() => props.suppliers.map(supplier => supplier.name))

const selectedCategory = computed({
  get() {
    return props.filters.category
  },
  set(value: string | undefined) {
    emit('update:filters', { category: value })
  }
})

const selectedPart = computed({
  get() {
    const part = props.filters.part
    return part ? `${part.part_number} - ${part.part_name}` : undefined
  },
  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', { part: undefined })
      return
    }

    const partNumber = value.split(' - ')[0]
    emit('update:filters', {
      part: props.parts.find(part => part.part_number === partNumber)
    })
  }
})

const selectedSupplier = computed({
  get() {
    return props.filters.supplier?.name
  },
  set(value: string | undefined) {
    emit('update:filters', {
      supplier: props.suppliers.find(supplier => supplier.name === value)
    })
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedCategory"
      :items="categoryItems"
      placeholder="Filter by Category"
      class="w-full md:w-42"
      clear
    />

    <USelectMenu
      v-model="selectedPart"
      :items="partItems"
      placeholder="Filter by Part"
      class="w-full md:w-72"
      clear
    />

    <USelectMenu
      v-model="selectedSupplier"
      :items="supplierItems"
      placeholder="Filter by Supplier"
      class="w-full md:w-72"
      clear
    />

    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search NG Ticket / Label Number"
      class="w-full md:w-72 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>
