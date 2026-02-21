<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { VehicleType } from '../../../../types'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  vehicleType: Partial<VehicleType>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Partial<VehicleType>]
}>()

const form = reactive<Partial<VehicleType>>({})

// Sync form when vehicleType prop changes (on modal open)
watch(() => props.vehicleType, (val) => {
  // Clear existing keys to avoid stale data
  for (const key in form) {
    delete form[key as keyof Partial<VehicleType>]
  }
  Object.assign(form, val)
}, { immediate: true, deep: true })

// Watch for modal open to ensure fresh form in add mode
watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'add') {
    // Clear all form fields
    for (const key in form) {
      delete form[key as keyof Partial<VehicleType>]
    }
    // Reset to empty vehicle type
    Object.assign(form, props.vehicleType)
  }
})

function handleSave() {
  // Exclude id from the data being sent
  const { id, ...data } = form
  emit('save', data)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal 
    :open="props.open"
    :title="props.mode === 'add' ? 'Add New Vehicle Type' : 'Edit Vehicle Type'"
    :description="props.mode === 'add' ? 'Add a new vehicle type' : 'Update vehicle type details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSave">
        <UFormField label="Type Name" name="name" required>
          <UInput v-model="form.name" placeholder="Truk Box" class="w-full" />
        </UFormField>
        
        <UFormField label="Load Capacity (kg)" name="load_capacity" required>
          <UInput
            v-model.number="form.load_capacity"
            type="number"
            placeholder="5000"
            class="w-full"
          />
        </UFormField>
      </form>
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
          color="primary"
          label="Save"
          :loading="props.loading"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
