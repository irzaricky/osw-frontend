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

const schema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  forecast_type: z.string().min(1, 'Forecast type is required'),
  start_period: z.string().min(1, 'Start period is required'),
  end_period: z.string().min(1, 'End period is required'),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  customer_id: undefined,
  forecast_type: '',
  start_period: '',
  end_period: '',
  description: ''
})

// Sync data when edit
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

// Reset when open in add mode
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

function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  emit('save', event.data)
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
      ? 'Add a new sales forecast to the system'
      : 'Update forecast details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        <UFormField label="Customer" name="customer_id" required>
          <USelectMenu
            v-model="selectedCustomer"
            :items="customerItems"
            class="w-full"
            placeholder="Select a customer"
            clear
          />
        </UFormField>

        <UFormField label="Forecast Type" name="forecast_type" required>
          <USelectMenu
            v-model="selectedType"
            :items="forecastTypeItems"
            class="w-full"
            placeholder="Select type"
            clear
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Start Period" name="start_period" required>
            <UInput type="date" v-model="state.start_period" class="w-full" />
          </UFormField>

          <UFormField label="End Period" name="end_period" required>
            <UInput type="date" v-model="state.end_period" class="w-full" />
          </UFormField>
        </div>

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
