<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useForecastStore } from '../../../../stores/sales/forecast.store'
import type { Forecast } from '../../../../types/sales/forecast'

const formRef = ref()
const store = useForecastStore()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  forecast: Partial<Forecast>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<Forecast>]
}>()

// For 'add' mode: customer_id, forecast_type, description
// For 'edit' mode: only customer_id and description (BE ignores the rest)
const addSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  forecast_type: z.string().min(1, 'Forecast type is required'),
  description: z.string().optional()
})

const editSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  description: z.string().optional()
})

const schema = computed(() => props.mode === 'add' ? addSchema : editSchema)

type AddSchema = z.output<typeof addSchema>
type EditSchema = z.output<typeof editSchema>

const state = reactive<{
  customer_id: number | undefined
  forecast_type: string
  start_period: string
  end_period: string
  description: string
}>({
  customer_id: undefined,
  forecast_type: '',
  start_period: '',
  end_period: '',
  description: ''
})

// ─── Sync data when edit ──────────────────────────────────────────────────────
watch(
  () => props.forecast,
  (val) => {
    state.customer_id = val.customer_id ?? undefined
    state.forecast_type = val.forecast_type ?? ''
    state.start_period = val.start_period ?? ''
    state.end_period = val.end_period ?? ''
    state.description = val.description ?? ''
  },
  { immediate: true, deep: true }
)

// ─── Reset when open in add mode ─────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.customer_id = undefined
      state.forecast_type = ''
      state.start_period = ''
      state.end_period = ''
      state.description = ''
    }
  }
)

// ─── Dropdowns ───────────────────────────────────────────────────────────────
const customerItems = computed(() => store.customersDropdown.map(c => c.name))
const selectedCustomer = computed({
  get: () => store.customersDropdown.find(c => c.id === state.customer_id)?.name,
  set: (val) => {
    state.customer_id = store.customersDropdown.find(c => c.name === val)?.id
  }
})

const forecastTypeItems = computed(() => store.forecastTypesDropdown)
const selectedType = computed({
  get: () => state.forecast_type,
  set: (val) => { state.forecast_type = val || '' }
})

// ─── Period Preview (computed from today + forecast_type) ─────────────────────
const periodPreview = computed(() => {
  if (!state.forecast_type) return null

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed

  const fmt = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

  if (state.forecast_type === 'Yearly') {
    // Next full year: 1 Jan next year — 31 Dec next year
    const nextYear = year + 1
    return {
      start: fmt(new Date(nextYear, 0, 1)),
      end: fmt(new Date(nextYear, 11, 31)),
      label: `${nextYear} (12 months)`
    }
  }

  if (state.forecast_type === 'Half-Year') {
    // Next 6 months starting next month
    const startDate = new Date(year, month + 1, 1)
    const endDate = new Date(year, month + 7, 0) // last day of 6th month ahead
    return {
      start: fmt(startDate),
      end: fmt(endDate),
      label: '6 months'
    }
  }

  if (state.forecast_type === '4-Month') {
    // Current month → 3 months ahead
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 4, 0) // last day of 4th month
    return {
      start: fmt(startDate),
      end: fmt(endDate),
      label: '4 months'
    }
  }

  return null
})

// ─── Form Submit ─────────────────────────────────────────────────────────────
function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  if (props.mode === 'add') {
    // Add: send customer_id, forecast_type, description
    const { customer_id, forecast_type, description } = event.data as AddSchema
    emit('save', { customer_id, forecast_type, description })
  } else {
    // Edit: only customer_id and description allowed by BE
    const { customer_id, description } = event.data as EditSchema
    emit('save', { customer_id, description })
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.mode === 'add' ? 'Add New Forecast' : 'Edit Forecast'"
    :description="props.mode === 'add'
      ? 'Period will be auto-calculated by the system based on forecast type.'
      : 'Update forecast details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <!-- Customer -->
        <UFormField label="Customer" name="customer_id" required>
          <USelectMenu
            v-model="selectedCustomer"
            :items="customerItems"
            class="w-full"
            placeholder="Select a customer"
            searchable
            clear
          />
        </UFormField>

        <!-- Forecast Type (Add Mode Only) -->
        <UFormField v-if="mode === 'add'" label="Forecast Type" name="forecast_type" required>
          <USelectMenu
            v-model="selectedType"
            :items="forecastTypeItems"
            class="w-full"
            placeholder="Select type"
            clear
          />
        </UFormField>

        <!-- Period Preview (Add Mode Only) -->
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="mode === 'add' && periodPreview"
            class="flex items-start gap-3 p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20"
          >
            <UIcon name="i-lucide-calendar-check" class="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div class="text-sm">
              <p class="font-medium text-primary-700 dark:text-primary-300">Auto-calculated Period</p>
              <p class="text-primary-600 dark:text-primary-400 mt-0.5">
                {{ periodPreview.start }} — {{ periodPreview.end }}
                <span class="ml-1 opacity-70">({{ periodPreview.label }})</span>
              </p>
            </div>
          </div>
        </Transition>

        <!-- Forecast info (Edit Mode Only — read-only) -->
        <div v-if="mode === 'edit' && (state.forecast_type || state.start_period)" class="grid grid-cols-2 gap-3">
          <div class="bg-elevated/50 rounded-lg border border-default p-3">
            <div class="text-xs text-muted mb-1">Forecast Type</div>
            <div class="text-sm font-semibold">{{ state.forecast_type || '-' }}</div>
          </div>
          <div class="bg-elevated/50 rounded-lg border border-default p-3">
            <div class="text-xs text-muted mb-1">Period</div>
            <div class="text-sm font-semibold">
              {{ state.start_period || '-' }} → {{ state.end_period || '-' }}
            </div>
          </div>
        </div>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" placeholder="Additional notes..." class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="close" />
        <UButton color="primary" label="Save" :loading="props.loading" @click="submitForm" />
      </div>
    </template>
  </UModal>
</template>
