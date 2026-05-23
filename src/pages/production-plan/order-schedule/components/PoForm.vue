<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { z } from 'zod'
import { CalendarDate, parseDate, type DateValue } from '@internationalized/date'

import { useProductionPlanStore } from '../../../../stores/production-plan/plan.store'
import { useOrderScheduleStore } from '../../../../stores/production-plan/order-schedule.store'
import { priorityOptions, fmtDate } from '../composables/usePOUtils'
import type { CreatePOPayload, POPriority } from '../../../../types/production-plan/order-schedule'

import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'
import type { Range } from '../../../../types'

// ── Props / Emits ──────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  mode:    'create' | 'edit'
  loading: boolean
}>(), {
  mode:    'create',
  loading: false,
})

const emit = defineEmits<{
  save:   [payload: { type: 'draft' | 'submit'; data: CreatePOPayload }]
  cancel: []
}>()

// ── Store ──────────────────────────────────────────────────────────────────────
const store = useOrderScheduleStore()
const planStore = useProductionPlanStore()
const { dropdown } = storeToRefs(planStore)

// ── Form state ─────────────────────────────────────────────────────────────────
const formRef = ref()

const state = reactive({
  plan_id:               undefined as number | undefined,
  production_start_date: '' as string,
  production_end_date:   '' as string,
  priority:              'Medium' as POPriority,
  po_description:        '' as string,
})

const selectedPlanData = computed(() =>
  dropdown.value.find(p => p.id === state.plan_id)
)

const latestDelivery = computed(() =>
  selectedPlanData.value?.latest_delivery_date
    ? parseDate(selectedPlanData.value.latest_delivery_date)
    : null
)

const isDateDisabled = computed(() => {
  if (!selectedPlanData.value?.latest_delivery_date) return undefined
  const latest = parseDate(selectedPlanData.value.latest_delivery_date)
  return (date: DateValue) => date.compare(latest) >= 0
})

const selectedPlanDetail = ref<any>(null)

watch(() => state.plan_id, async (id) => {
  dateRange.value      = undefined
  selectedPlanDetail.value = null
  if (!id) return
  try {
    const res = await planStore.fetchPlan(id)
    selectedPlanDetail.value = res?.data ?? null
  } catch {}
})

const latestProductItem = computed(() => {
  const products = selectedPlanDetail.value?.details ?? []
  if (!products.length) return null
  return [...products].sort(
    (a: any, b: any) => new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime()
  )[0]
})

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  plan_id:               z.number({ required_error: 'Please select a production plan.' }),
  production_start_date: z.string().min(1, 'Start date is required.'),
  production_end_date:   z.string().min(1, 'End date is required.'),
  priority:              z.enum(['Low', 'Medium', 'High']),
  po_description:        z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.production_start_date && data.production_end_date) {
    if (new Date(data.production_end_date) <= new Date(data.production_start_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End Date must be after Start Date.',
        path: ['production_end_date'],
      })
    }
  }
  if (data.plan_id && data.production_end_date) {
    const plan = dropdown.value.find(p => p.id === data.plan_id)
    if (plan?.latest_delivery_date && new Date(data.production_end_date) >= new Date(plan.latest_delivery_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `End Date must be before Latest Delivery Date (${fmtDate(plan.latest_delivery_date)}).`,
        path: ['production_end_date'],
      })
    }
  }
  // Di superRefine tambah validasi end date vs latest delivery:
  if (data.production_end_date && selectedPlanData.value?.latest_delivery_date) {
    if (data.production_end_date >= selectedPlanData.value.latest_delivery_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `End Date must before Latest Delivery Date (${fmtDate(selectedPlanData.value.latest_delivery_date)}).`,
        path: ['production_end_date'],
      })
    }
  }
})

// ── Plan dropdown ──────────────────────────────────────────────────────────────
const planItems = computed(() =>
  [dropdown.value.map(p => ({
    label: `${p.plan_number}${p.plan_description ? ` — ${p.plan_description}` : ''}`,
    value: p.id,
  }))]
)

const selectedPlan = computed({
  get() {
    if (!state.plan_id) return undefined
    const found = dropdown.value.find(p => p.id === state.plan_id)
    return found ? { label: `${found.plan_number}${found.plan_description ? ` — ${found.plan_description}` : ''}`, value: found.id } : undefined
  },
  set(item: { label: string; value: number } | undefined) {
    state.plan_id = item?.value
  },
})

// ── Priority items ─────────────────────────────────────────────────────────────
const selectedPriority = computed({
  get() {
    return priorityOptions.find(p => p.value === state.priority) ?? priorityOptions[1]
  },
  set(item: { label: string; value: POPriority } | undefined) {
    if (item) state.priority = item.value
  },
})

// ── Date helpers ───────────────────────────────────────────────────────────────
const dateRange = ref<Range | undefined>(undefined)

// Tambah watcher untuk sync ke state
watch(dateRange, (val) => {
  state.production_start_date = val?.start ? formatLocalDate(val.start) : ''
  state.production_end_date   = val?.end   ? formatLocalDate(val.end)   : ''
})

function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Error handler ──────────────────────────────────────────────────────────────
function onError(errors: any) {
  console.warn('[OrderScheduleForm] validation errors:', errors)
}

// ── Submit ─────────────────────────────────────────────────────────────────────
async function handleSubmit(type: 'draft' | 'submit') {
  const result = schema.safeParse(state)
  if (!result.success) {
    // trigger UForm native validation untuk tampilkan error di UI
    await formRef.value?.validate().catch(() => {})
    return
  }

  const payload: CreatePOPayload = {
    plan_id:               state.plan_id!,
    production_start_date: state.production_start_date,
    production_end_date:   state.production_end_date,
    priority:              state.priority,
    po_description:        state.po_description || undefined,
  }

  emit('save', { type, data: payload })
}

// Reset dateRange saat plan berubah
watch(() => state.plan_id, () => {
  dateRange.value = undefined
})

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => {
  planStore.fetchDropdown()
})
</script>

<template>
  <div class="space-y-6">
    <UForm
      ref="formRef"
      :schema="schema"
      :state="state"
      class="grid grid-cols-1 md:grid-cols-3 gap-4"
      @error="onError"
    >
      <!-- Plan select -->
      <UFormField
        label="Production Plan"
        name="plan_id"
        required
        class="md:col-span-2"
        help="Only approved production plans are available for selection."
      >
        <USelectMenu
          v-model="selectedPlan"
          :items="planItems"
          value-attribute="value"
          option-attribute="label"
          placeholder="Select Production Plan"
          class="w-full"
          clear
        />
      </UFormField>

      <!-- Priority -->
      <UFormField label="Priority" name="priority" required>
        <USelectMenu
          v-model="selectedPriority"
          :items="[priorityOptions]"
          value-attribute="value"
          option-attribute="label"
          placeholder="Select Priority"
          class="w-full"
        />
      </UFormField>

      <div
        v-if="selectedPlanData"
        class="md:col-span-3 bg-elevated border border-default rounded-lg px-4 py-3 space-y-3"
      >
        <!-- Delivery window -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-0.5">
              Earliest Delivery
            </p>
            <p class="font-mono font-medium">
              {{ fmtDate(selectedPlanData.earliest_delivery_date) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide mb-0.5">
              Latest Delivery
            </p>
            <p class="font-mono font-medium text-error-600 dark:text-error-400">
              {{ fmtDate(selectedPlanData.latest_delivery_date) }}
            </p>
          </div>
          <div v-if="selectedPlanData.plan_description" class="md:col-span-1">
            <p class="text-xs text-muted uppercase tracking-wide mb-0.5">
              Description
            </p>
            <p>{{ selectedPlanData.plan_description }}</p>
          </div>
        </div>

        <!-- Latest product item -->
        <template v-if="latestProductItem">
          <div class="border-t border-default pt-3">
            <p class="text-xs text-muted uppercase tracking-wide mb-2">
              Product with Latest Delivery Date
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p class="text-xs text-muted mb-0.5">
                  Part Number
                </p>
                <p class="font-mono font-semibold">
                  {{ latestProductItem.part?.part_number ?? '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted mb-0.5">
                  Part Name
                </p>
                <p>{{ latestProductItem.part?.part_name ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-muted mb-0.5">
                  Customer
                </p>
                <p>{{ latestProductItem.customer?.name ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-muted mb-0.5">
                  Delivery Date
                </p>
                <p class="font-mono font-semibold text-warning-600 dark:text-warning-400">
                  {{ fmtDate(latestProductItem.delivery_date) }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Start End Date -->
      <UFormField
        label="Production Date Range"
        name="production_start_date"
        required
        class="md:col-span-3"
        :help="selectedPlanData?.latest_delivery_date
          ? `End Date must be before ${fmtDate(selectedPlanData.latest_delivery_date)}.`
          : 'Select the production date range for this order.'"
      >
        <HomeDateRangePicker 
          v-model="dateRange" 
          :is-date-disabled="isDateDisabled ?? undefined" 
          :disabled="!state.plan_id" 
          clear 
          class="w-full" 
        />
      </UFormField>

      <!-- Description -->
      <UFormField label="Description" name="po_description" class="md:col-span-3">
        <UInput
          v-model="state.po_description"
          placeholder="Optional notes or description for this production order..."
          class="w-full"
        />
      </UFormField>
    </UForm>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2 border-t border-default">
      <UButton
        color="neutral"
        variant="outline"
        label="Cancel"
        :disabled="props.loading"
        @click="emit('cancel')"
      />
      <UButton
        color="neutral"
        variant="outline"
        label="Save as Draft"
        :loading="props.loading"
        @click="handleSubmit('draft')"
      />
      <UButton
        color="primary"
        variant="solid"
        label="Submit for Approval"
        :loading="props.loading"
        @click="handleSubmit('submit')"
      />
    </div>
  </div>
</template>