<script setup lang="ts">
import { computed }     from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { WOHealth } from '../../../../types/production-plan/wo-monitor'

interface Filters {
  health?:   WOHealth | undefined
  line_id?:  number   | undefined
  shift_id?: number   | undefined
}

const props = defineProps<{
  filters:  Filters
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

const dateModel = computed({
  get(): CalendarDate | null {
    if (!props.workDate) return null
    const [y, m, d] = props.workDate.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) { emit('update:workDate', ''); return }
    const yyyy = val.year
    const mm   = String(val.month).padStart(2, '0')
    const dd   = String(val.day).padStart(2, '0')
    emit('update:workDate', `${yyyy}-${mm}-${dd}`)
  },
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UInputDate v-model="dateModel">
      <template #trailing>
        <UPopover>
          <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
          <template #content>
            <UCalendar v-model="dateModel" class="p-2" />
          </template>
        </UPopover>
      </template>
    </UInputDate>

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