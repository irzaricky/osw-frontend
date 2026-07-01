<script setup lang="ts">
import dayjs from 'dayjs'

defineProps<{
  issueDetails: any[]
  issueMeta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}>()

const emit = defineEmits<{
  'update:issue-page': [page: number]
}>()

function formatDate(date?: string) {
  if (!date) return '-'
  return dayjs(date).format('DD MMM YYYY HH:mm:ss')
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-semibold">
        Recent Production Issues
      </div>
    </template>

    <div v-if="!issueDetails.length" class="py-6 text-center text-muted">
      No issues found.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default text-left">
            <th class="p-3">Date</th>
            <th class="p-3">WO Number</th>
            <th class="p-3">Station</th>
            <th class="p-3">Issue Type</th>
            <th class="p-3">Downtime (min)</th>
            <th class="p-3">Defect</th>
            <th class="p-3">Severity</th>
            <th class="p-3">Reported By</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="issue in issueDetails"
            :key="issue.id"
            class="border-b border-default"
          >
            <td class="p-3">{{ formatDate(issue.reported_time) }}</td>
            <td class="p-3 font-medium">{{ issue.wo_number }}</td>
            <td class="p-3">{{ issue.station_name }} ({{ issue.station_code }})</td>
            <td class="p-3">{{ issue.issue_type }}</td>
            <td class="p-3">{{ issue.downtime_minutes ?? '-' }}</td>
            <td class="p-3">
              {{ issue.defect_type ? `${issue.defect_type} (${issue.defect_qty ?? 0})` : '-' }}
            </td>
            <td class="p-3">
              <UBadge
                :color="issue.severity === 'High' ? 'error' : issue.severity === 'Medium' ? 'warning' : 'neutral'"
                variant="soft"
              >
                {{ issue.severity || '-' }}
              </UBadge>
            </td>
            <td class="p-3">{{ issue.reported_by || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs text-muted">
          Showing
          {{ ((issueMeta.page - 1) * issueMeta.limit) + 1 }}
          -
          {{ Math.min(issueMeta.page * issueMeta.limit, issueMeta.total) }}
          of {{ issueMeta.total }} issue(s)
        </p>

        <UPagination
          :page="issueMeta.page"
          :items-per-page="issueMeta.limit"
          :total="issueMeta.total"
          @update:page="emit('update:issue-page', $event)"
        />
      </div>
    </template>
  </UCard>
</template>
