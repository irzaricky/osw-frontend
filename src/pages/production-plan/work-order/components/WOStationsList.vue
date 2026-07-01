<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { WorkOrderStation, StationStatus, WorkOrderStatus } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  stations:  WorkOrderStation[]
  woStatus:  WorkOrderStatus
}>()

const emit = defineEmits<{
  select: [stationId: number]
}>()

const STATION_STATUS_COLOR: Record<StationStatus, 'neutral' | 'warning' | 'success'> = {
  Pending:     'neutral',
  In_Progress: 'warning',
  Completed:   'success',
}

// ── Sort: In_Progress first, then by sequence ─────────────────────────────────
// Within "In_Progress" and "everything else" groups, order falls back to sequence.
const sortedStations = computed(() =>
  [...props.stations].sort((a, b) => {
    const aPriority = a.status === 'In_Progress' ? 0 : 1
    const bPriority = b.status === 'In_Progress' ? 0 : 1
    if (aPriority !== bPriority) return aPriority - bPriority
    return a.sequence - b.sequence
  }),
)

// ── Pagination (client-side) ──────────────────────────────────────────────────
const page = ref(1)
const limit = 5

const paginatedStations = computed(() => {
  const start = (page.value - 1) * limit
  return sortedStations.value.slice(start, start + limit)
})

// Reset to page 1 if the station list changes size (e.g. after a refetch)
// so the user isn't stranded on a page that no longer exists.
watch(() => props.stations.length, () => { page.value = 1 })

function progressPct(station: WorkOrderStation): number {
  if (!station.planned_quantity || !station.actual_quantity) return 0
  return Math.min(100, Math.round((station.actual_quantity / station.planned_quantity) * 100))
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="sortedStations.length === 0"
      class="flex flex-col items-center justify-center py-12 text-center text-muted gap-2"
    >
      <UIcon name="i-lucide-layout-grid" class="w-8 h-8" />
      <p class="text-sm">No process stations configured for this Work Order.</p>
    </div>

    <!-- Clickable station card -->
    <button
      v-for="station in paginatedStations"
      :key="station.id"
      class="w-full text-left flex items-center gap-4 px-5 py-4 bg-default border border-default rounded-xl transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :class="{
        'border-warning-300 dark:border-warning-700 bg-warning-50/50 dark:bg-warning-950/20': station.status === 'In_Progress',
        'border-success-300 dark:border-success-700 bg-success-50/50 dark:bg-success-950/20': station.status === 'Completed',
      }"
      @click="emit('select', station.id)"
    >
      <!-- Sequence badge -->
      <div class="w-8 h-8 rounded-full bg-elevated border border-default flex items-center justify-center flex-shrink-0">
        <span class="text-xs font-mono font-bold">{{ station.sequence }}</span>
      </div>

      <!-- Station info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-sm font-semibold">
            {{ station.station?.name ?? `Station #${station.station_id}` }}
          </p>
          <span v-if="station.wo_station_number" class="text-xs font-mono text-muted">
            {{ station.wo_station_number }}
          </span>
        </div>
        <p class="text-xs text-muted font-mono">{{ station.station?.station_code }}</p>
        <p v-if="station.notes" class="text-xs text-muted mt-0.5 truncate">{{ station.notes }}</p>
      </div>

      <!-- Progress & qty -->
      <div class="flex items-center gap-4 text-xs text-muted flex-shrink-0">
        <div v-if="station.planned_quantity != null" class="text-right">
          <p class="font-mono font-semibold text-sm">
            {{ (station.actual_quantity ?? 0).toLocaleString() }}
            <span class="text-muted font-normal"> / {{ station.planned_quantity.toLocaleString() }}</span>
          </p>
          <p class="text-muted">{{ progressPct(station) }}% complete</p>
        </div>
      </div>

      <!-- Issue indicator -->
      <div
        v-if="station.open_issue_count ?? 0 > 0"
        class="flex items-center gap-1.5 text-xs font-semibold text-error-600 flex-shrink-0"
      >
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75" />
          <span class="relative inline-flex rounded-full h-2 w-2 bg-error-500" />
        </span>
        {{ station.open_issue_count }} issue{{ station.open_issue_count ?? 1 ? 's' : '' }}
      </div>

      <UBadge
        :label="station.status.replace('_', ' ')"
        :color="STATION_STATUS_COLOR[station.status]"
        variant="soft"
        size="sm"
        class="flex-shrink-0"
      />

      <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted flex-shrink-0" />
    </button>

    <!-- Pagination -->
    <div
      v-if="sortedStations.length > limit"
      class="flex items-center justify-between gap-3 pt-2"
    >
      <div class="text-sm text-muted">
        {{ sortedStations.length === 0 ? '0' : (page - 1) * limit + 1 }}–{{ Math.min(page * limit, sortedStations.length) }} of {{ sortedStations.length }} row(s)
      </div>
      <UPagination
        v-model:page="page"
        :total="sortedStations.length"
        :items-per-page="limit"
      />
    </div>
  </div>
</template>