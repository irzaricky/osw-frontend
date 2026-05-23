<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrderStation, WorkOrderStatus, JobStatus, UpdateStationJobStatusPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  stations: WorkOrderStation[]
  woStatus: WorkOrderStatus
  saving:   boolean
}>()

const emit = defineEmits<{
  'update-job-status': [stationId: number, jobId: number, payload: UpdateStationJobStatusPayload]
}>()

const stationStatusColor = {
  Pending:     'neutral',
  In_Progress: 'warning',
  Completed:   'success',
} as const

const jobStatusColor = {
  Pending:     'neutral',
  In_Progress: 'warning',
  Completed:   'success',
} as const

const canUpdateJobs = computed(() =>
  props.woStatus === 'In_Progress' || props.woStatus === 'Released',
)

function nextJobStatus(current: JobStatus): JobStatus | null {
  if (current === 'Pending')     return 'In_Progress'
  if (current === 'In_Progress') return 'Completed'
  return null
}

function nextJobLabel(current: JobStatus): string {
  if (current === 'Pending')     return 'Start Job'
  if (current === 'In_Progress') return 'Complete Job'
  return ''
}

function handleJobAction(station: WorkOrderStation, jobId: number, currentStatus: JobStatus) {
  const next = nextJobStatus(currentStatus)
  if (!next) return
  emit('update-job-status', station.id, jobId, { status: next })
}

const sortedStations = computed(() =>
  [...props.stations].sort((a, b) => a.sequence - b.sequence),
)
</script>

<template>
  <div class="mt-4 space-y-4">
    <div v-if="sortedStations.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-muted gap-2">
      <UIcon name="i-lucide-layout-grid" class="w-8 h-8" />
      <p class="text-sm">
        No process stations configured for this Work Order.
      </p>
    </div>

    <div
      v-for="station in sortedStations"
      :key="station.id"
      class="bg-default border border-default rounded-xl overflow-hidden"
    >
      <!-- Station Header -->
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-default"
        :class="{
          'bg-warning-50 dark:bg-warning-950/30': station.status === 'In_Progress',
          'bg-success-50 dark:bg-success-950/30': station.status === 'Completed',
        }"
      >
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-elevated border border-default flex items-center justify-center flex-shrink-0">
            <span class="text-xs font-mono font-bold">{{ station.sequence }}</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold">
                {{ station.station?.name ?? `Station #${station.station_id}` }}
              </p>
              <UBadge
                :label="station.status"
                :color="stationStatusColor[station.status]"
                variant="soft"
                size="xs"
              />
            </div>
            <p class="text-xs text-muted font-mono">
              {{ station.station?.station_code }}
            </p>
          </div>
        </div>
      </div>

      <!-- Jobs -->
      <div v-if="station.jobs && station.jobs.length > 0">
        <div
          v-for="job in [...station.jobs].sort((a, b) => a.sequence - b.sequence)"
          :key="job.id"
          class="flex items-center gap-4 px-5 py-3 border-b border-default last:border-b-0 hover:bg-elevated/40 transition-colors"
        >
          <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-mono text-muted">
            {{ job.sequence }}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">
              {{ job.job?.name ?? `Job #${job.job_id}` }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-muted font-mono">{{ job.job?.job_code }}</span>
              <span v-if="job.job?.standard_time" class="text-xs text-muted">
                · Std: {{ job.job.standard_time }}min
              </span>
              <span v-if="job.actual_time != null" class="text-xs text-muted">
                · Actual: {{ job.actual_time }}min
              </span>
            </div>
          </div>

          <UBadge
            :label="job.status"
            :color="jobStatusColor[job.status]"
            variant="soft"
            size="sm"
          />

          <UButton
            v-if="canUpdateJobs && nextJobStatus(job.status)"
            :label="nextJobLabel(job.status)"
            :color="job.status === 'Pending' ? 'primary' : 'success'"
            variant="soft"
            size="xs"
            :loading="saving"
            :icon="job.status === 'Pending' ? 'i-lucide-play' : 'i-lucide-check'"
            @click="handleJobAction(station, job.id, job.status)"
          />
        </div>
      </div>

      <div v-else class="px-5 py-4 text-sm text-muted">
        No jobs configured for this station.
      </div>
    </div>
  </div>
</template>