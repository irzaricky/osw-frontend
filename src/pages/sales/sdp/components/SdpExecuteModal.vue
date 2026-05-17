<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSdoStore } from '../../../../stores/sales/sdo.store'
import type { Sdp } from '../../../../types/sales/sdp'

const formRef = ref()
const store = useSdoStore()

const props = defineProps<{
  open: boolean
  loading: boolean
  plan?: Sdp | null
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

// Calculate the total planned package load for the delivery plan
const planTotalLoad = computed(() => {
  if (!props.plan?.details) return 0
  let total = 0
  props.plan.details.forEach((detail: any) => {
    const part = detail.spoDetail?.part
    const pkg = part?.package
    if (pkg) {
      const capacity = pkg.capacity || 1
      const loadFactor = pkg.load !== null ? pkg.load : 1.0
      const numPackages = Math.ceil(detail.planned_qty / capacity)
      total += numPackages * loadFactor
    } else {
      total += detail.planned_qty
    }
  })
  return total
})

// Determine if vehicle is overloaded
const selectedVehicleCapacity = computed(() => {
  return selectedVehicle.value?.vehicle_type?.load_capacity ?? 50
})

const loadPercentage = computed(() => {
  const cap = selectedVehicleCapacity.value
  if (!cap) return 0
  return (planTotalLoad.value / cap) * 100
})

const isOverloaded = computed(() => {
  if (!selectedVehicle.value) return false
  return planTotalLoad.value > selectedVehicleCapacity.value
})

function submitForm() {
  if (isOverloaded.value) return
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
              variant="outline"
              class="w-full justify-between bg-elevated border border-default hover:bg-default/5 font-normal"
            >
              <span class="truncate">{{ selectedDriver?.full_name || 'Select driver' }}</span>
              <UIcon :name="driverMenuOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4 text-muted-foreground shrink-0" />
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
              variant="outline"
              class="w-full justify-between bg-elevated border border-default hover:bg-default/5 font-normal"
            >
              <span class="truncate">{{ selectedVehicle?.license_plate || 'Select vehicle plate' }}</span>
              <UIcon :name="vehicleMenuOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4 text-muted-foreground shrink-0" />
            </UButton>
          </USelectMenu>
        </UFormField>

        <!-- Load Capacity Indicator -->
        <div v-if="selectedVehicle" class="mt-4 p-4 border border-default rounded-xl bg-default/5 space-y-2">
          <div class="flex justify-between items-center text-xs font-semibold">
            <span class="text-muted-foreground">Total Ship Load:</span>
            <span class="text-default font-bold">{{ planTotalLoad.toFixed(1) }} units</span>
          </div>
          <div class="flex justify-between items-center text-xs font-semibold">
            <span class="text-muted-foreground">Vehicle Capacity:</span>
            <span class="text-default font-bold">{{ selectedVehicleCapacity }} units</span>
          </div>
          
          <div class="w-full bg-default/10 rounded-full h-2 overflow-hidden mt-1">
            <div
              class="h-full rounded-full transition-all duration-350"
              :class="isOverloaded ? 'bg-error' : 'bg-success'"
              :style="{ width: `${Math.min(loadPercentage, 100)}%` }"
            ></div>
          </div>
          
          <p v-if="isOverloaded" class="text-[11px] font-bold text-error flex items-center gap-1 mt-1">
            <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5" />
            <span>Overloaded! Select a vehicle with higher capacity.</span>
          </p>
          <p v-else class="text-[11px] font-semibold text-success flex items-center gap-1 mt-1">
            <UIcon name="i-lucide-check-circle-2" class="w-3.5 h-3.5" />
            <span>Vehicle load capacity is sufficient.</span>
          </p>
        </div>
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
          :disabled="isOverloaded"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>
