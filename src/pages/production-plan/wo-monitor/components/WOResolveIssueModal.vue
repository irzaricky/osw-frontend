<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useAuthStore }         from '../../../../stores/auth.store'
import type { MonitorWO, MonitorIssue } from '../../../../types/production-plan/wo-monitor'
import type { IssueType }       from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  wo:      MonitorWO | null
  saving:  boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'resolve': [payload: {
    woStationId:           number
    issueId:               number
    resolution:            string
    resolvedBy:             number
    resumedBy?:             number
    resumedAt?:             string | null
    pauseDurationMinutes?:  number | null
  }]
}>()

const authStore = useAuthStore()

const activeIssueId = ref<number | null>(null)

const form = reactive({ resolution: '' })
const errors = reactive({ resolution: '', session: '' })

const issueTypeColor: Record<IssueType, 'error' | 'warning' | 'info' | 'neutral'> = {
  DOWNTIME: 'error',
  DEFECT:   'warning',
  MATERIAL: 'info',
  PAUSE:    'neutral',
  OTHER:    'neutral',
}

const issueTypeLabel: Record<IssueType, string> = {
  DOWNTIME: 'Downtime',
  DEFECT:   'Defect',
  MATERIAL: 'Material',
  PAUSE:    'Pause',
  OTHER:    'Other',
}

watch(() => props.open, (v) => {
  if (v) {
    activeIssueId.value = null
    resetForm()
  }
})

function resetForm() {
  form.resolution   = ''
  errors.resolution = ''
  errors.session     = ''
}

function startResolve(issue: MonitorIssue) {
  activeIssueId.value = issue.id
  resetForm()
}

function calcPauseDuration(issue: MonitorIssue, resumedAt: Date): number | null {
  if (!issue.paused_at) return null
  const pausedAt = new Date(issue.paused_at)
  const diffMs   = resumedAt.getTime() - pausedAt.getTime()
  return Math.max(0, Math.round(diffMs / 60000))
}

function cancelResolve() {
  activeIssueId.value = null
}

function fmtDateTime(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-US', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function stationLabel(issue: MonitorIssue): string {
  return (
    issue.station_name
    ?? issue.wo_station_number
    ?? (issue.station_code ? `Station ${issue.station_code}` : null)
    ?? `Station #${issue.wo_station_id}`
  )
}

function submitResolve(issue: MonitorIssue) {
  errors.resolution = ''
  errors.session     = ''

  if (!form.resolution.trim()) {
    errors.resolution = 'Resolution details are required.'
    return
  }
  if (!authStore.user?.id) {
    errors.session = 'User session not found. Please refresh and try again.'
    return
  }

  const now = new Date()

  emit('resolve', {
    woStationId:          issue.wo_station_id,
    issueId:              issue.id,
    resolution:           form.resolution.trim(),
    resolvedBy:           authStore.user!.id,
    resumedBy:            issue.issue_type === 'PAUSE' ? authStore.user!.id : undefined,
    resumedAt:            issue.issue_type === 'PAUSE' ? now.toISOString() : undefined,
    pauseDurationMinutes: issue.issue_type === 'PAUSE' ? calcPauseDuration(issue, now) : undefined,
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Resolve Issues"
    :description="wo ? `${wo.wo_number} \u2014 ${wo.open_issues.length} open issue(s)` : ''"
    :ui="{ content: 'sm:max-w-lg' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="wo" class="space-y-3">
        <div
          v-if="wo.open_issues.length === 0"
          class="flex flex-col items-center justify-center py-10 text-center text-muted gap-2"
        >
          <UIcon name="i-lucide-check-circle-2" class="w-7 h-7 text-success-500" />
          <p class="text-sm">No open issues for this Work Order.</p>
        </div>

        <div
          v-for="issue in wo.open_issues"
          :key="issue.id"
          class="border border-default rounded-lg p-3.5 space-y-2.5"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <UBadge
              :label="issueTypeLabel[issue.issue_type]"
              :color="issueTypeColor[issue.issue_type]"
              variant="soft"
              size="sm"
            />
            <UBadge
              v-if="issue.severity"
              :label="issue.severity"
              :color="issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? 'error' : issue.severity === 'MEDIUM' ? 'warning' : 'neutral'"
              variant="subtle"
              size="sm"
            />
            <span class="text-xs text-muted ml-auto flex items-center gap-1">
              <UIcon name="i-lucide-map-pin" class="w-3 h-3" />
              {{ stationLabel(issue) }}
            </span>
          </div>

          <p class="text-sm font-medium">{{ issue.issue_description }}</p>

          <p class="text-xs text-muted flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="w-3 h-3" />
            Reported {{ fmtDateTime(issue.reported_time) }}
          </p>

          <div v-if="activeIssueId === issue.id" class="pt-2 border-t border-default space-y-2">
            <UFormField label="Resolution" :error="errors.resolution" required>
              <UTextarea
                v-model="form.resolution"
                placeholder="Describe how the issue was resolved..."
                :rows="3"
                class="w-full"
              />
            </UFormField>

            <UAlert
              v-if="errors.session"
              color="error"
              variant="soft"
              icon="i-lucide-alert-circle"
              :description="errors.session"
            />
            <div class="flex items-center justify-end gap-2">
              <UButton label="Cancel" color="neutral" variant="ghost" size="sm" @click="cancelResolve" />
              <UButton
                label="Mark as Resolved"
                icon="i-lucide-check"
                color="success"
                size="sm"
                :loading="saving"
                @click="submitResolve(issue)"
              />
            </div>
          </div>

          <UButton
            v-else
            label="Resolve"
            icon="i-lucide-check"
            color="success"
            variant="soft"
            size="xs"
            @click="startResolve(issue)"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end w-full">
        <UButton label="Close" color="neutral" variant="ghost" @click="emit('update:open', false)" />
      </div>
    </template>
  </UModal>
</template>