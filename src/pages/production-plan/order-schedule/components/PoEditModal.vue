<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { z } from 'zod'
import type { POSchedule, UpdateSchedulePayload } from '../../../../types/production-plan/order-schedule'
import { fmtDate, fmtNum } from '../composables/usePOUtils'

// ── Props / Emits ──────────────────────────────────────────────────────────────
const props = defineProps<{
  open:     boolean
  schedule: POSchedule | null
  loading:  boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save:          [payload: UpdateSchedulePayload]
}>()

// ── Form state ─────────────────────────────────────────────────────────────────
const state = reactive({
  planned_qty_per_day: 0,
  notes:               '' as string | null,
})

// ── Validation errors ──────────────────────────────────────────────────────────
const errors = reactive<Record<string, string>>({})

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  planned_qty_per_day: z
    .number({ required_error: 'Planned quantity is required.' })
    .min(1, 'Must be at least 1.'),
  notes: z.string().nullable().optional(),
})

// ── Sync on open ───────────────────────────────────────────────────────────────
watch(() => props.schedule, (s) => {
  if (s) {
    state.planned_qty_per_day = s.planned_qty_per_day
    state.notes               = s.notes ?? ''
    // Clear errors when a new schedule is loaded
    Object.keys(errors).forEach(k => delete errors[k])
  }
}, { immediate: true })

// ── Submit ─────────────────────────────────────────────────────────────────────
function onSubmit() {
  // Clear previous errors
  Object.keys(errors).forEach(k => delete errors[k])

  // Validate via Zod directly — avoids dependency on UForm.validate() which
  // may not be exposed in all versions of Nuxt UI, causing a silent no-op.
  const maxCap = props.schedule?.line_capacity_per_day

  const extendedSchema = maxCap != null
    ? schema.superRefine((data, ctx) => {
        if (data.planned_qty_per_day > maxCap) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Cannot exceed line capacity of ${fmtNum(maxCap)} unit/shift.`,
            path: ['planned_qty_per_day'],
          })
        }
      })
    : schema

  const result = extendedSchema.safeParse({
    planned_qty_per_day: state.planned_qty_per_day,
    notes: state.notes,
  })

  if (!result.success) {
    result.error.errors.forEach(e => {
      const key = e.path[0] as string
      errors[key] = e.message
    })
    return
  }

  const payload: UpdateSchedulePayload = {
    planned_qty_per_day: state.planned_qty_per_day,
    notes:               state.notes || null,
  }
  emit('save', payload)
}

function onCancel() {
  Object.keys(errors).forEach(k => delete errors[k])
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Edit Schedule Row"
    :ui="{ content: 'max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div v-if="props.schedule" class="space-y-4">
        <!-- Read-only context -->
        <div class="bg-elevated rounded-lg p-3 text-sm space-y-2">
          <div class="flex justify-between">
            <span class="text-muted">Part</span>
            <span class="font-mono font-semibold">{{ props.schedule.part?.part_number }} — {{ props.schedule.part?.part_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Production Date</span>
            <span class="font-mono">{{ fmtDate(props.schedule.production_date) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Line</span>
            <span>{{ props.schedule.line?.name ?? props.schedule.line_name_snapshot ?? '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Shift</span>
            <span>{{ props.schedule.shift?.name ?? props.schedule.shift_name_snapshot ?? '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Capacity / Shift</span>
            <span class="font-mono">
              {{ props.schedule.line_capacity_per_day != null ? fmtNum(props.schedule.line_capacity_per_day) : '—' }}
              <span class="text-muted text-xs ml-1">unit/shift</span>
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Current Utilization</span>
            <span class="font-mono">{{ props.schedule.utilization_pct != null ? `${props.schedule.utilization_pct}%` : '—' }}</span>
          </div>
        </div>

        <!-- Editable fields — validation handled by onSubmit() directly via Zod -->
        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">
              Planned Qty (this shift)
              <span class="text-error-500">*</span>
            </label>
            <UInput
              v-model.number="state.planned_qty_per_day"
              type="number"
              :min="1"
              :max="props.schedule.line_capacity_per_day ?? undefined"
              class="w-full"
              :class="errors.planned_qty_per_day ? 'ring-1 ring-error-500' : ''"
            />
            <p v-if="errors.planned_qty_per_day" class="text-xs text-error-500">{{ errors.planned_qty_per_day }}</p>
            <p v-else class="text-xs text-muted">
              {{
                props.schedule.line_capacity_per_day != null
                  ? `Max capacity for this shift: ${fmtNum(props.schedule.line_capacity_per_day)} unit/shift`
                  : 'Enter the planned quantity for this shift.'
              }}
            </p>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Notes</label>
            <UTextarea
              v-model="state.notes"
              placeholder="Optional notes for this schedule row..."
              :rows="3"
              class="w-full"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          label="Cancel"
          :disabled="props.loading"
          @click="onCancel"
        />
        <UButton
          color="primary"
          variant="solid"
          label="Save Changes"
          :loading="props.loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>