<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { z } from 'zod'
import type { POSchedule, UpdateSchedulePayload } from '../../../../types/production-plan/order-schedule'
import { fmtDate } from '../composables/usePOUtils'

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
const formRef = ref()
const state = reactive({
  planned_qty_per_day: 0,
  notes:               '' as string | null,
})

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  planned_qty_per_day: z.number({ required_error: 'Planned quantity is required.' }).min(1, 'Must be at least 1.'),
  notes:               z.string().nullable().optional(),
})

// ── Sync on open ───────────────────────────────────────────────────────────────
watch(() => props.schedule, (s) => {
  if (s) {
    state.planned_qty_per_day = s.planned_qty_per_day
    state.notes               = s.notes ?? ''
  }
}, { immediate: true })

// ── Submit ─────────────────────────────────────────────────────────────────────
async function onSubmit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  const payload: UpdateSchedulePayload = {
    planned_qty_per_day: state.planned_qty_per_day,
    notes:               state.notes || null,
  }
  emit('save', payload)
}

function onCancel() {
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
            <span class="text-muted">Line Capacity</span>
            <span class="font-mono">{{ props.schedule.line_capacity_per_day ?? '—' }}</span>
          </div>
        </div>

        <!-- Editable fields -->
        <UForm
          ref="formRef"
          :schema="schema"
          :state="state"
          class="space-y-4"
        >
          <UFormField label="Planned Qty per Day" name="planned_qty_per_day" required>
            <UInput
              v-model.number="state.planned_qty_per_day"
              type="number"
              :min="1"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Notes" name="notes">
            <UTextarea
              v-model="state.notes"
              placeholder="Optional notes for this schedule row..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </UForm>
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