<script setup lang="ts">
import { computed } from 'vue'
import type { JobType } from '../../../../types/master-data/job'

interface Filters {
  job_type_id: number | undefined
  active: boolean | undefined
}

const props = defineProps<{
  search: string
  filters: Filters
  jobTypes: JobType[]
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'update:filters': [value: Partial<Filters>]
}>()

const typeItems = computed(() => [props.jobTypes.map(t => t.name)])
const statusItems = [['Active', 'Inactive']]

const selectedType = computed({
  get: () => props.jobTypes.find(t => t.id === props.filters.job_type_id)?.name,
  set: (v) => emit('update:filters', { job_type_id: v ? props.jobTypes.find(t => t.name === v)?.id : undefined }),
})

const selectedStatus = computed({
  get: () => props.filters.active === undefined ? undefined : props.filters.active ? 'Active' : 'Inactive',
  set: (v) => emit('update:filters', { active: v != null ? v === 'Active' : undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <USelectMenu v-model="selectedType" :items="typeItems" placeholder="All Types" class="w-44" clear />
    <USelectMenu v-model="selectedStatus" :items="statusItems" placeholder="All Status" class="w-44" clear />
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search jobs..."
      class="w-64 ml-auto"
      @update:model-value="emit('update:search', $event as string)"
    />
  </div>
</template>