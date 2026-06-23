<script setup lang="ts">
import { ref } from 'vue'
import DetailsTab  from './PlanDetailTabs.vue'
import CapacityTab from './PlanCapacityTabs.vue'

defineProps<{
  currentPlan:        any
  calendarPreview:    any[]
  editParamForm:      any
  loading:            boolean
  saving:             boolean
  calculating:        boolean
  calculatingAll:     boolean
  isEditable:         boolean
  planId:             number | null
  fmtDate:            (d?: string | null) => string
  fmtNum:             (n?: number | null) => string
  overallStatusLabel: Record<string, string>
  overallStatusColor: Record<string, string>
  detailStatusColor:  (s?: string | null) => string
}>()

defineExpose({
  goToDetails: () => { activeTab.value = 'details' }
})

const emit = defineEmits<{
  (e: 'save-param-edit'): void
  (e: 'calculate'): void
  (e: 'calculate-all'): void
  (e: 'add-adjustment', payload: any): void
  (e: 'update-adjustment', id: number, payload: any): void
  (e: 'delete-adjustment', id: number): void
}>()

const tabs = [
  { slot: 'details'  as const, value: 'details',  label: 'Request Details',  icon: 'i-lucide-list' },
  { slot: 'capacity' as const, value: 'capacity', label: 'Capacity Settings', icon: 'i-lucide-settings-2' },
]

const activeTab = ref('details')
</script>

<template>
  <UTabs v-model="activeTab" :items="tabs" variant="link" class="w-full">
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
        :edit-param-form="editParamForm"
        :calendar-preview="calendarPreview"
        :saving="saving"
        :calculating="calculating"
        :calculating-all="calculatingAll"
        :is-editable="isEditable"
        :fmt-num="fmtNum"
        :fmt-date="fmtDate"
        :overall-status-label="overallStatusLabel"
        :overall-status-color="overallStatusColor"
        @save-param-edit="emit('save-param-edit')"
        @calculate="emit('calculate')"
        @calculate-all="emit('calculate-all')"
        @add-adjustment="emit('add-adjustment', $event)"
        @update-adjustment="(id, payload) => emit('update-adjustment', id, payload)"
        @delete-adjustment="emit('delete-adjustment', $event)"
      />
    </template>
  </UTabs>
</template>