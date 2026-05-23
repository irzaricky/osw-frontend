<script setup lang="ts">
import type { WorkOrderIssue, IssueType } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  issues:  WorkOrderIssue[]
  loading: boolean
  saving:  boolean
}>()

const emit = defineEmits<{
  'resolve': [issueId: number]
}>()

const issueTypeColor: Record<IssueType, 'error' | 'warning' | 'info' | 'neutral'> = {
  DOWNTIME: 'error',
  DEFECT:   'warning',
  MATERIAL: 'info',
  OTHER:    'neutral',
}

function fmtDateTime(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-US', {
    day:    '2-digit',
    month:  'short',
    hour:   '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="mt-4 bg-default border border-default rounded-xl overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h3 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-primary" />
        Issues
      </h3>
      <UBadge
        :label="`${issues.length} total`"
        color="neutral"
        variant="soft"
        size="sm"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
    </div>

    <div v-else-if="issues.length === 0" class="flex flex-col items-center justify-center py-10 text-center text-muted gap-2">
      <UIcon name="i-lucide-check-circle-2" class="w-7 h-7 text-success-500" />
      <p class="text-sm">
        No issues reported for this Work Order.
      </p>
    </div>

    <div v-else class="divide-y divide-default">
      <div
        v-for="issue in issues"
        :key="issue.id"
        class="px-5 py-4 hover:bg-elevated/40 transition-colors"
        :class="{ 'opacity-60': !!issue.resolved_time }"
      >
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge
                :label="issue.issue_type"
                :color="issueTypeColor[issue.issue_type]"
                variant="soft"
                size="sm"
              />
              <span v-if="issue.resolved_time" class="inline-flex items-center gap-1 text-xs text-success-600">
                <UIcon name="i-lucide-check-circle" class="w-3 h-3" />
                Resolved
              </span>
              <span v-else class="inline-flex items-center gap-1 text-xs text-error-600">
                <UIcon name="i-lucide-alert-circle" class="w-3 h-3" />
                Open
              </span>
            </div>

            <p class="text-sm font-medium">
              {{ issue.issue_description }}
            </p>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-clock" class="w-3 h-3" />
                {{ fmtDateTime(issue.reported_time) }}
              </span>
              <span>By: {{ issue.reported_by }}</span>
              <span v-if="issue.downtime_minutes != null">
                Downtime: {{ issue.downtime_minutes }} min
              </span>
              <span v-if="issue.defect_qty != null">
                Defect Qty: {{ issue.defect_qty }}
              </span>
              <span v-if="issue.defect_type">
                Defect Type: {{ issue.defect_type }}
              </span>
            </div>

            <div v-if="issue.resolved_time" class="mt-1.5 p-2.5 bg-success-50 dark:bg-success-950/30 rounded-lg border border-success-200 dark:border-success-800">
              <p class="text-xs font-medium text-success-700 dark:text-success-400">
                Resolution
              </p>
              <p class="text-xs text-success-700 dark:text-success-400 mt-0.5">
                {{ issue.resolution }}
              </p>
              <p class="text-xs text-muted mt-1">
                By {{ issue.resolved_by }} · {{ fmtDateTime(issue.resolved_time) }}
              </p>
            </div>
          </div>

          <UButton
            v-if="!issue.resolved_time"
            label="Resolve"
            icon="i-lucide-check"
            color="success"
            variant="soft"
            size="xs"
            :loading="saving"
            @click="emit('resolve', issue.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>