<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrderStation, StationStatus } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  stations: WorkOrderStation[]
}>()

const stationStatusColor: Record<StationStatus, 'neutral' | 'warning' | 'success'> = {
  Pending:     'neutral',
  In_Progress: 'warning',
  Completed:   'success',
}

const sortedStations = computed(() =>
  [...props.stations].sort((a, b) => a.sequence - b.sequence),
)
</script>

<template>
  <div class="mt-4 space-y-3">
    <div v-if="sortedStations.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-muted gap-2">
      <UIcon name="i-lucide-layout-grid" class="w-8 h-8" />
      <p class="text-sm">No process stations configured for this Work Order.</p>
    </div>

    <div
      v-for="station in sortedStations"
      :key="station.id"
      class="flex items-center gap-4 px-5 py-4 bg-default border border-default rounded-xl"
      :class="{
        'border-warning-300 dark:border-warning-700 bg-warning-50/50 dark:bg-warning-950/20': station.status === 'In_Progress',
        'border-success-300 dark:border-success-700 bg-success-50/50 dark:bg-success-950/20': station.status === 'Completed',
      }"
    >
      <div class="w-7 h-7 rounded-full bg-elevated border border-default flex items-center justify-center flex-shrink-0">
        <span class="text-xs font-mono font-bold">{{ station.sequence }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold">
          {{ station.station?.name ?? `Station #${station.station_id}` }}
        </p>
        <p class="text-xs text-muted font-mono">{{ station.station?.station_code }}</p>
      </div>

      <div class="flex items-center gap-3 text-xs text-muted">
        <span v-if="station.planned_quantity != null" class="font-mono">
          Plan: {{ station.planned_quantity.toLocaleString() }}
        </span>
        <span v-if="station.actual_quantity != null" class="font-mono">
          Actual: {{ station.actual_quantity.toLocaleString() }}
        </span>
      </div>

      <UBadge
        :label="station.status.replace('_', ' ')"
        :color="stationStatusColor[station.status]"
        variant="soft"
        size="sm"
      />
    </div>
  </div>
</template>