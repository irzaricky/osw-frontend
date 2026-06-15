<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAuthStore } from '../../../../stores/auth.store'
import type {
  WorkOrder,
  ReportIssuePayload,
  IssueType,
  IssueSeverity,
} from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  wo:      WorkOrder
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: ReportIssuePayload]
}>()

const authStore = useAuthStore()

const ISSUE_TYPES: { value: IssueType; label: string; icon: string }[] = [
  { value: 'DOWNTIME', label: 'Downtime',  icon: 'i-lucide-zap-off' },
  { value: 'DEFECT',   label: 'Defect',    icon: 'i-lucide-x-circle' },
  { value: 'MATERIAL', label: 'Material',  icon: 'i-lucide-package-x' },
  { value: 'PAUSE',    label: 'Pause',     icon: 'i-lucide-pause-circle' },
  { value: 'OTHER',    label: 'Other',     icon: 'i-lucide-more-horizontal' },
]

const SEVERITY_OPTIONS: { value: IssueSeverity; label: string; color: string }[] = [
  { value: 'LOW',      label: 'Low',      color: 'text-muted' },
  { value: 'MEDIUM',   label: 'Medium',   color: 'text-warning-600' },
  { value: 'HIGH',     label: 'High',     color: 'text-orange-600' },
  { value: 'CRITICAL', label: 'Critical', color: 'text-error-600' },
]

const form = reactive({
  issue_type:        '' as IssueType | '',
  issue_description: '',
  severity:          'MEDIUM' as IssueSeverity,
  downtime_start:    '',
  downtime_end:      '',
  downtime_minutes:  null as number | null,
  defect_qty:        null as number | null,
  defect_type:       '',
  pause_reason:      '',
})

const errors = reactive({
  issue_type:        '',
  issue_description: '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.issue_type        = ''
    form.issue_description = ''
    form.severity          = 'MEDIUM'
    form.downtime_start    = ''
    form.downtime_end      = ''
    form.downtime_minutes  = null
    form.defect_qty        = null
    form.defect_type       = ''
    form.pause_reason      = ''
    errors.issue_type        = ''
    errors.issue_description = ''
  }
})

function validate(): boolean {
  let valid = true
  errors.issue_type        = ''
  errors.issue_description = ''
  if (!form.issue_type)              { errors.issue_type = 'Issue type is required.'; valid = false }
  if (!form.issue_description.trim()) { errors.issue_description = 'Description is required.'; valid = false }
  return valid
}

function handleSubmit() {
  if (!validate()) return
  const userId = authStore.user?.id
  if (!userId) {
    errors.issue_description = 'User session not found. Please refresh and try again.'
    return
  }
  const payload: ReportIssuePayload = {
    issue_type:          form.issue_type as IssueType,
    issue_description:   form.issue_description.trim(),
    reported_by_user_id: userId,
    severity:            form.severity,
    downtime_start:      form.downtime_start || null,
    downtime_end:        form.downtime_end   || null,
    downtime_minutes:    form.downtime_minutes,
    defect_qty:          form.defect_qty,
    defect_type:         form.defect_type || null,
    pause_reason:        form.pause_reason || null,
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

        <!-- Issue Type grid -->
        <UFormField label="Issue Type" :error="errors.issue_type" required>
          <div class="grid grid-cols-2 gap-2 mt-1">
            <button
              v-for="t in ISSUE_TYPES"
              :key="t.value"
              type="button"
              class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm text-left transition-all"
              :class="form.issue_type === t.value
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-default bg-elevated hover:bg-elevated/80 text-default'"
              @click="form.issue_type = t.value"
            >
              <UIcon :name="t.icon" class="w-4 h-4 flex-shrink-0" />
              {{ t.label }}
            </button>
          </div>
        </UFormField>

        <!-- Severity -->
        <UFormField label="Severity">
          <div class="flex items-center gap-2 mt-1">
            <button
              v-for="s in SEVERITY_OPTIONS"
              :key="s.value"
              type="button"
              class="flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all"
              :class="form.severity === s.value
                ? `border-current ${s.color} bg-elevated`
                : 'border-default text-muted bg-elevated hover:bg-elevated/80'"
              @click="form.severity = s.value"
            >
              {{ s.label }}
            </button>
          </div>
          <p v-if="form.severity === 'HIGH' || form.severity === 'CRITICAL'" class="text-xs text-error-600 mt-1.5">
            <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 inline mr-1" />
            HIGH/CRITICAL issues will block Work Order completion until resolved.
          </p>
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
          <UFormField label="Downtime Minutes (Override)" description="Leave blank to auto-calculate from start/end.">
            <UInput
              v-model.number="form.downtime_minutes"
              type="number"
              min="0"
              placeholder="Auto-calculated..."
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

        <!-- Pause fields -->
        <template v-if="form.issue_type === 'PAUSE'">
          <UFormField label="Pause Reason">
            <UInput v-model="form.pause_reason" placeholder="e.g. Shift change, maintenance..." class="w-full" />
          </UFormField>
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