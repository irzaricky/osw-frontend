<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { WorkOrder, ReportIssuePayload, IssueType } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  wo:      WorkOrder
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: ReportIssuePayload]
}>()

const ISSUE_TYPES: IssueType[] = ['DOWNTIME', 'DEFECT', 'MATERIAL', 'OTHER']

const form = reactive({
  issue_type:        '' as IssueType | '',
  issue_description: '',
  reported_by:       '',
  downtime_start:    '',
  downtime_end:      '',
  downtime_minutes:  null as number | null,
  defect_qty:        null as number | null,
  defect_type:       '',
})

const errors = reactive({
  issue_type:        '',
  issue_description: '',
  reported_by:       '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.issue_type        = ''
    form.issue_description = ''
    form.reported_by       = ''
    form.downtime_start    = ''
    form.downtime_end      = ''
    form.downtime_minutes  = null
    form.defect_qty        = null
    form.defect_type       = ''
    errors.issue_type        = ''
    errors.issue_description = ''
    errors.reported_by       = ''
  }
})

function validate(): boolean {
  let valid = true
  errors.issue_type        = ''
  errors.issue_description = ''
  errors.reported_by       = ''

  if (!form.issue_type) { errors.issue_type = 'Issue type is required.'; valid = false }
  if (!form.issue_description.trim()) { errors.issue_description = 'Description is required.'; valid = false }
  if (!form.reported_by.trim()) { errors.reported_by = 'Reporter name is required.'; valid = false }
  return valid
}

function handleSubmit() {
  if (!validate()) return
  const payload: ReportIssuePayload = {
    issue_type:        form.issue_type as IssueType,
    issue_description: form.issue_description.trim(),
    reported_by:       form.reported_by.trim(),
    downtime_start:    form.downtime_start || null,
    downtime_end:      form.downtime_end   || null,
    downtime_minutes:  form.downtime_minutes,
    defect_qty:        form.defect_qty,
    defect_type:       form.defect_type   || null,
  }
  emit('submit', payload)
}
</script>

<template>
  <UModal
    :open="open"
    title="Report Issue"
    description="Report a production issue for this Work Order."
    :ui="{ content: 'sm:max-w-lg' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Issue Type -->
        <UFormField label="Issue Type" :error="errors.issue_type" required>
          <USelectMenu
            v-model="form.issue_type"
            :items="ISSUE_TYPES"
            placeholder="Select issue type..."
            class="w-full"
          />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" :error="errors.issue_description" required>
          <UTextarea
            v-model="form.issue_description"
            placeholder="Describe the issue in detail..."
            :rows="3"
            class="w-full"
          />
        </UFormField>

        <!-- Reported By -->
        <UFormField label="Reported By" :error="errors.reported_by" required>
          <UInput
            v-model="form.reported_by"
            placeholder="Your name or employee ID..."
            class="w-full"
          />
        </UFormField>

        <!-- Downtime fields -->
        <template v-if="form.issue_type === 'DOWNTIME'">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Downtime Start">
              <UInput v-model="form.downtime_start" type="datetime-local" class="w-full" />
            </UFormField>
            <UFormField label="Downtime End">
              <UInput v-model="form.downtime_end" type="datetime-local" class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Downtime Minutes (Override)">
            <UInput
              v-model.number="form.downtime_minutes"
              type="number"
              min="0"
              placeholder="Auto-calculated from start/end..."
              class="w-full font-mono"
            />
          </UFormField>
        </template>

        <!-- Defect fields -->
        <template v-if="form.issue_type === 'DEFECT'">
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Defect Quantity">
              <UInput v-model.number="form.defect_qty" type="number" min="0" class="w-full font-mono" />
            </UFormField>
            <UFormField label="Defect Type">
              <UInput v-model="form.defect_type" placeholder="e.g. Scratch, Dimension..." class="w-full" />
            </UFormField>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Submit Issue"
          icon="i-lucide-alert-triangle"
          color="warning"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>