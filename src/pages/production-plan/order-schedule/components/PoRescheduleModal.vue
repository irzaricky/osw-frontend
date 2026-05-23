<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { z } from 'zod'
import type { ReschedulePayload } from '../../../../types/production-plan/order-schedule'
import { fmtDate } from '../composables/usePOUtils'

const props = defineProps<{
  open:                boolean
  currentStart?:       string
  currentEnd?:         string
  latestDeliveryDate?: string
  loading:             boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm:       [payload: ReschedulePayload]
}>()

const formRef = ref()

const state = reactive({
  new_start_date:    props.currentStart ?? '',
  new_end_date:      props.currentEnd ?? '',
  reschedule_reason: '',
})

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  new_start_date:    z.string().min(1, 'New start date is required.'),
  new_end_date:      z.string().min(1, 'New end date is required.'),
  reschedule_reason: z.string().min(10, 'Please provide a reason of at least 10 characters.'),
}).superRefine((data, ctx) => {
  if (data.new_start_date && data.new_end_date) {
    if (new Date(data.new_end_date) <= new Date(data.new_start_date)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: 'New End Date must be after New Start Date.',
        path:    ['new_end_date'],
      })
    }
  }
  if (props.latestDeliveryDate && data.new_end_date) {
    if (new Date(data.new_end_date) >= new Date(props.latestDeliveryDate)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: `New End Date must be before Latest Delivery Date (${fmtDate(props.latestDeliveryDate)}).`,
        path:    ['new_end_date'],
      })
    }
  }
})

// ── Date helpers ───────────────────────────────────────────────────────────────
function toCalendarDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}
function fromCalendarDate(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

const newStartModel = computed({
  get() { return state.new_start_date ? toCalendarDate(state.new_start_date) : undefined },
  set(val: any) { state.new_start_date = val ? fromCalendarDate(val) : '' },
})

const newEndModel = computed({
  get() { return state.new_end_date ? toCalendarDate(state.new_end_date) : undefined },
  set(val: any) { state.new_end_date = val ? fromCalendarDate(val) : '' },
})

// ── Submit ─────────────────────────────────────────────────────────────────────
async function onConfirm() {
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  emit('confirm', {
    new_start_date:    state.new_start_date,
    new_end_date:      state.new_end_date,
    reschedule_reason: state.reschedule_reason,
  })
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Reschedule Production Order"
    :ui="{ content: 'max-w-lg' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-5">
        <UAlert
          icon="i-lucide-calendar-x"
          color="warning"
          variant="soft"
          title="Rescheduling a Released PO"
          description="This will impact existing Work Orders. All impacted WOs will be logged. Provide a clear reason for the reschedule."
        />

        <!-- Current range summary -->
        <div class="bg-elevated rounded-lg p-3 text-sm space-y-1">
          <p class="text-xs text-muted uppercase tracking-wide mb-2">
            Current Schedule
          </p>
          <div class="flex justify-between">
            <span class="text-muted">Start Date</span>
            <span class="font-mono font-semibold">{{ fmtDate(props.currentStart) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">End Date</span>
            <span class="font-mono font-semibold">{{ fmtDate(props.currentEnd) }}</span>
          </div>
          <div v-if="props.latestDeliveryDate" class="flex justify-between">
            <span class="text-muted">Latest Delivery</span>
            <span class="font-mono text-error-600 dark:text-error-400 font-semibold">{{ fmtDate(props.latestDeliveryDate) }}</span>
          </div>
        </div>

        <UForm
          ref="formRef"
          :schema="schema"
          :state="state"
          class="space-y-4"
        >
          <!-- New start date -->
          <UFormField label="New Start Date" name="new_start_date" required>
            <UInputDate v-model="state.new_start_date" class="w-full">
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="px-0"
                  />
                  <template #content>
                    <UCalendar v-model="newStartModel" class="p-2" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>

          <!-- New end date -->
          <UFormField label="New End Date" name="new_end_date" required>
            <UInputDate v-model="state.new_end_date" class="w-full">
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="px-0"
                  />
                  <template #content>
                    <UCalendar
                      v-model="newEndModel"
                      class="p-2"
                      :is-date-disabled="(date: any) => {
                        if (!state.new_start_date) return false
                        const cur = new Date(date.year, date.month - 1, date.day)
                        const start = new Date(state.new_start_date)
                        const latest = props.latestDeliveryDate ? new Date(props.latestDeliveryDate) : null
                        if (cur <= start) return true
                        if (latest && cur >= latest) return true
                        return false
                      }"
                    />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>

          <!-- Reason -->
          <UFormField label="Reschedule Reason" name="reschedule_reason" required>
            <UTextarea
              v-model="state.reschedule_reason"
              placeholder="Describe the reason for this reschedule (required)..."
              :rows="4"
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
          @click="emit('update:open', false)"
        />
        <UButton
          color="warning"
          variant="solid"
          label="Confirm Reschedule"
          :loading="props.loading"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>