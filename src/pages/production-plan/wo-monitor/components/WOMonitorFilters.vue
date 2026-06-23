<script setup lang="ts">
import { computed } from 'vue'
import type { WOHealth } from '../../../../types/production-plan/wo-monitor'

interface Filters {
  health?: WOHealth | undefined
  line_id?:  number | undefined
  shift_id?: number | undefined
}

const props = defineProps<{
  filters: Filters
  workDate: string
}>()

const emit = defineEmits<{
  'update:filters':  [value: Partial<Filters>]
  'update:workDate': [value: string]
}>()

const HEALTH_OPTIONS: { label: string; value: WOHealth }[] = [
  { label: 'Not Started', value: 'not_started' },
  { label: 'On Track',    value: 'on_track' },
  { label: 'At Risk',     value: 'at_risk' },
  { label: 'Critical',    value: 'critical' },
  { label: 'Completed',   value: 'completed' },
]

const selectedHealth = computed({
  get: () => props.filters.health,
  set: (v) => emit('update:filters', { health: v ?? undefined }),
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UInput
      :model-value="workDate"
      type="date"
      size="sm"
      class="w-44"
      @update:model-value="emit('update:workDate', $event)"
    />

    <USelectMenu
      v-model="selectedHealth"
      :items="HEALTH_OPTIONS"
      value-key="value"
      placeholder="All Status"
      size="sm"
      class="w-36"
      clear
    />
  </div>
</template>