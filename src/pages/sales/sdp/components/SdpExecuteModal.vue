<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSdoStore } from '../../../../stores/sales/sdo.store'

const formRef = ref()
const store = useSdoStore()

const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: { vehicle_id: number; driver_id: number }]
}>()

// State parameters for form
const state = reactive({
  driver_id: undefined as number | undefined,
  vehicle_id: undefined as number | undefined
})

// Validation Schema
const schema = z.object({
  driver_id: z.number({ message: 'Driver is required' }),
  vehicle_id: z.number({ message: 'Vehicle is required' })
})

// Load dropdowns on open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      state.driver_id = undefined
      state.vehicle_id = undefined
      store.fetchDropdownDrivers()
      store.fetchDropdownVehicles()
    }
  }
)

const driverItems = computed(() => store.drivers)
const selectedDriver = computed({
  get: () => driverItems.value.find(d => d.user_id === state.driver_id),
  set: (val) => {
    state.driver_id = val?.user_id
  }
})

const vehicleItems = computed(() => store.vehicles)
const selectedVehicle = computed({
  get: () => vehicleItems.value.find(v => v.id === state.vehicle_id),
  set: (val) => {
    state.vehicle_id = val?.id
  }
})

function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  emit('save', {
    driver_id: event.data.driver_id,
    vehicle_id: event.data.vehicle_id
  })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Execute Delivery Order (SDO)"
    description="Allocate a fleet vehicle and assign a driver to transfer this plan into an active shipping execution."
    class="sm:max-w-md"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <!-- Driver Selection -->
        <UFormField label="Select Driver" name="driver_id" required>
          <USelectMenu
            v-slot="{ open: driverMenuOpen }"
            v-model="selectedDriver"
            :items="driverItems"
            class="w-full"
            placeholder="Search and select driver"
            label-key="full_name"
          >
            <UButton
              color="neutral"
              variant="subtle"
              class="w-full justify-between"
              :icon="driverMenuOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              trailing
            >
              {{ selectedDriver?.full_name || 'Select driver' }}
            </UButton>
          </USelectMenu>
        </UFormField>

        <!-- Vehicle Selection -->
        <UFormField label="Select Vehicle (Plate)" name="vehicle_id" required>
          <USelectMenu
            v-slot="{ open: vehicleMenuOpen }"
            v-model="selectedVehicle"
            :items="vehicleItems"
            class="w-full"
            placeholder="Search and select license plate"
            label-key="license_plate"
          >
            <UButton
              color="neutral"
              variant="subtle"
              class="w-full justify-between"
              :icon="vehicleMenuOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              trailing
            >
              {{ selectedVehicle?.license_plate || 'Select vehicle plate' }}
            </UButton>
          </USelectMenu>
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />
        <UButton
          color="success"
          label="Execute Shipment"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>
