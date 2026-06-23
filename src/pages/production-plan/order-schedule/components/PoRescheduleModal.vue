<script setup lang="ts">
import { ref, computed } from 'vue'
import { z } from 'zod'
import type { ReschedulePayload } from '../../../../types/production-plan/order-schedule'
import { fmtDate } from '../composables/usePOUtils'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'
import type { Range } from '../../../../types'
import { parseDate, type DateValue } from '@internationalized/date'

const props = defineProps<{
  open:                boolean
  currentStart?:       string
  currentEnd?:         string
  latestDeliveryDate?: string
  planMonth?:          string
  loading:             boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm:       [payload: ReschedulePayload]
}>()

const formRef = ref()

// ── Date range state ───────────────────────────────────────────────────────────
const dateRange = ref<Range | undefined>(
  props.currentStart && props.currentEnd
    ? { start: new Date(props.currentStart), end: new Date(props.currentEnd) }
    : undefined,
)

// ── String ISO turunan untuk validasi & payload ────────────────────────────────
function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const startIso = computed(() => dateRange.value?.start ? formatLocalDate(dateRange.value.start) : '')
const endIso   = computed(() => dateRange.value?.end   ? formatLocalDate(dateRange.value.end)   : '')

const planMonth = computed(() =>
  props.planMonth ?? props.currentStart?.slice(0, 7) ?? null
)

const isDateDisabled = computed(() => {
  if (!planMonth.value) return undefined
  const [year, month] = planMonth.value.split('-').map(Number)
  return (date: DateValue) => date.year !== year || date.month !== month
})

// ── Reason state ───────────────────────────────────────────────────────────────
const rescheduleReason = ref('')

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  new_start_date:    z.string().min(1, 'Start date is required.'),
  new_end_date:      z.string().min(1, 'End date is required.'),
  reschedule_reason: z.string().min(10, 'Please provide a reason of at least 10 characters.'),
}).superRefine((data, ctx) => {
  if (data.new_start_date && data.new_end_date) {
    if (new Date(data.new_end_date) <= new Date(data.new_start_date)) {
      ctx.addIssue({
        code:    z.ZodIssueCode.custom,
        message: 'End Date must be after Start Date.',
        path:    ['new_end_date'],
      })
    }
  }
  // Validasi bulan
  if (planMonth.value) {
    const [y, m] = planMonth.value.split('-').map(Number)
    for (const [field, iso] of [
      ['new_start_date', data.new_start_date],
      ['new_end_date',   data.new_end_date],
    ] as const) {
      if (iso) {
        const d = new Date(iso)
        if (d.getFullYear() !== y || d.getMonth() + 1 !== m) {
          ctx.addIssue({
            code:    z.ZodIssueCode.custom,
            message: `Date must be within the plan month (${planMonth.value}).`,
            path:    [field],
          })
        }
      }
    }
  }
})

// State yang diumpankan ke UForm
const formState = computed(() => ({
  new_start_date:    startIso.value,
  new_end_date:      endIso.value,
  reschedule_reason: rescheduleReason.value,
}))

// ── Submit ─────────────────────────────────────────────────────────────────────
async function onConfirm() {
  const payload = {
    new_start_date:    startIso.value,
    new_end_date:      endIso.value,
    reschedule_reason: rescheduleReason.value,
  }

  const result = schema.safeParse(payload)
  console.log('safeParse result:', result)

  if (!result.success) {
    await formRef.value?.validate().catch(() => {})
    return
  }

  emit('confirm', payload)
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
          <p class="text-xs text-muted uppercase tracking-wide mb-2">Current Schedule</p>
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
            <span class="font-mono text-error-600 dark:text-error-400 font-semibold">
              {{ fmtDate(props.latestDeliveryDate) }}
            </span>
          </div>
        </div>

        <UForm
          ref="formRef"
          :schema="schema"
          :state="formState"
          class="space-y-4"
        >
          <!-- Date range -->
          <UFormField
            label="New Production Date Range"
            name="new_start_date"
            required
            :help="planMonth
              ? `Date range must be within ${planMonth}.`
              : 'Select the production date range for this order.'"
          >
            <HomeDateRangePicker
              v-model="dateRange"
              :is-date-disabled="isDateDisabled ?? undefined"
              clear
              class="w-full"
            />
          </UFormField>

          <!-- Reason -->
          <UFormField label="Reschedule Reason" name="reschedule_reason" required>
            <UTextarea
              v-model="rescheduleReason"
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