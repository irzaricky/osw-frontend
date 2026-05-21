<script setup lang="ts">
import DetailsTab  from './PlanDetailTabs.vue'
import CapacityTab from './PlanCapacityTabs.vue'

defineProps<{
  currentPlan:      any
  selectedLineId:   number | undefined
	lines: any
  lineParams:       any
  loadingParams:    boolean
  adjustmentForm:   any
  loading:          boolean
  saving:           boolean
  calculating:      boolean
  isEditable:       boolean
  planId:           number | null
  fmtDate:          (d?: string | null) => string
  fmtNum:           (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
  detailStatusColor:  (s?: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'update:selectedLineId', val: number | undefined): void
  (e: 'save-base'): void
  (e: 'save-adjustment'): void
  (e: 'calculate'): void
  (e: 'delete-adjustment', adjId: number): void
}>()

const tabs = [
  { slot: 'details'  as const, label: 'Request Details',   icon: 'i-lucide-list' },
  { slot: 'capacity' as const, label: 'Capacity Settings', icon: 'i-lucide-settings-2' },
]
</script>

<template>
  <UTabs :items="tabs" variant="link" class="w-full">
    <template #details>
      <DetailsTab
        :loading="loading"
        :current-plan="currentPlan"
        :is-editable="isEditable"
        :fmt-date="fmtDate"
        :fmt-num="fmtNum"
        :overall-status-label="overallStatusLabel"
        :overall-status-color="overallStatusColor"
        :detail-status-color="detailStatusColor"
      />
    </template>

    <template #capacity>
      <CapacityTab
        :current-plan="currentPlan"
        :selected-line-id="selectedLineId"
		  	:lines="lines"
        :line-params="lineParams"
        :loading-params="loadingParams"
        :adjustment-form="adjustmentForm"
        :saving="saving"
        :calculating="calculating"
        :is-editable="isEditable"
        :plan-id="planId"
        :fmt-num="fmtNum"
        :overall-status-label="overallStatusLabel"
        :overall-status-color="overallStatusColor"
        @update:selected-line-id="emit('update:selectedLineId', $event)"
        @save-base="emit('save-base')"
        @save-adjustment="emit('save-adjustment')"
        @calculate="emit('calculate')"
        @delete-adjustment="(id) => emit('delete-adjustment', id)"
      />
    </template>
  </UTabs>
</template>