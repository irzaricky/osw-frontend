<script setup lang="ts">
import { computed } from 'vue'
import type { SupplierDropdown } from '../../../../types/master-data/suppliers'

interface Filters {
  supplier_id: number | undefined
  part_type_code: string | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  suppliers: SupplierDropdown[]
  partTypes: { code: string; name: string }[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const supplierItems = computed(() => [
  props.suppliers.map(s => s.name)
])

const selectedSupplier = computed({
  get() {
    if (props.filters.supplier_id == null) return undefined
    return props.suppliers.find(s => s.id === props.filters.supplier_id)?.name
  },
  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', { supplier_id: undefined })
      return
    }
    const found = props.suppliers.find(s => s.name === value)
    emit('update:filters', { supplier_id: found?.id })
  }
})

const partTypeItems = computed(() => [
  props.partTypes.map(t => t.name)
])

const selectedPartType = computed({
  get() {
    if (props.filters.part_type_code == null) return undefined
    return props.partTypes.find(t => t.code === props.filters.part_type_code)?.name
  },
  set(value: string | undefined) {
    if (!value) {
      emit('update:filters', { part_type_code: undefined })
      return
    }
    const found = props.partTypes.find(t => t.name === value)
    emit('update:filters', { part_type_code: found?.code })
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu
      v-model="selectedSupplier"
      :items="supplierItems"
      placeholder="Filter by Supplier"
      class="w-full md:w-48"
      clear
    />
    <USelectMenu
      v-model="selectedPartType"
      :items="partTypeItems"
      placeholder="Filter by Type"
      class="w-full md:w-48"
      clear
    />
    <UInput
      :model-value="props.search"
      icon="i-lucide-search"
      placeholder="Search parts..."
      class="w-full md:w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>