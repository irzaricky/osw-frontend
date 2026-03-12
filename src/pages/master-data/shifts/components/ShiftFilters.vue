<script setup lang="ts">
import { computed } from 'vue'
import type { ShiftType, ShiftCategory } from '../../../../types/master-data/shift'

const props = defineProps<{
  search: string
  filters: {
    type?: string
    category?: string
    active?: boolean
  }
  shiftTypes: ShiftType[]
  shiftCategories: ShiftCategory[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: typeof props.filters]
}>()

const typeItems = computed(() => [props.shiftTypes.map(t => t.name)])
const categoryItems = computed(() => [props.shiftCategories.map(c => c.name)])
const activeItems = [['Active', 'Inactive']]

const selectedType = computed({
  get: () => props.filters.type ?? null,
  set: (v) => emit('update:filters', { ...props.filters, type: v != null ? v : undefined }),
})

const selectedCategory = computed({
  get: () => props.filters.category ?? null,
  set: (v) => emit('update:filters', { ...props.filters, category: v != null ? v : undefined }),
})

const selectedActive = computed({
  get: () => props.filters.active !== undefined ? (props.filters.active ? 'Active' : 'Inactive') : null,
  set: (v) => emit('update:filters', { ...props.filters, active: v != null ? v === 'Active' : undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
      <USelectMenu v-model="selectedType" :items="typeItems" placeholder="Type" class="w-36" clear />
      <USelectMenu v-model="selectedCategory" :items="categoryItems" placeholder="Category" class="w-36" clear />
      <USelectMenu v-model="selectedActive" :items="activeItems" placeholder="Status" class="w-32" clear />
      <UInput
        :model-value="search"
        icon="i-lucide-search"
        placeholder="Search shifts..."
        class="w-64 ml-auto"
        @update:model-value="emit('update:search', $event)"
      />
  </div>
</template>