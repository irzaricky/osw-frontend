<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import type { Vehicle } from '../../../../types'
import type { DropdownOption } from '../composables/useVehicleDropdowns'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  vehicle: Partial<Vehicle>
  vehicleTypes: DropdownOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: FormData]
}>()

const form = reactive<Partial<Vehicle>>({})
const imageFile = ref<File | null>(null)
const imageError = ref<string | null>(null)

// Sync form when vehicle prop changes (on modal open)
watch(() => props.vehicle, (val) => {
  // Clear existing keys to avoid stale data
  for (const key in form) {
    delete form[key as keyof Partial<Vehicle>]
  }
  
  // Assign all values from prop
  Object.assign(form, val)
  if (!form.vehicle_type_id && val.vehicle_type?.id) {
    form.vehicle_type_id = val.vehicle_type.id
  }
  
  // Clear file input when opening modal
  imageFile.value = null
  imageError.value = null
}, { immediate: true, deep: true })

// Watch for modal open to ensure fresh form in add mode
watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'add') {
    // Clear all form fields
    for (const key in form) {
      delete form[key as keyof Partial<Vehicle>]
    }
    // Reset to empty vehicle
    Object.assign(form, props.vehicle)
    imageFile.value = null
    imageError.value = null
  }
})

// Watch for file changes and validate
watch(imageFile, (file) => {
  imageError.value = null
  
  if (!file) return
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    imageError.value = 'Only JPEG, PNG, and WebP images are allowed'
    imageFile.value = null
    return
  }
  
  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    imageError.value = 'Image size must be below 5MB'
    imageFile.value = null
    return
  }
})

function handleSave() {
  const formData = new FormData()
  
  // Add form fields only if they have values
  if (form.vehicle_code) formData.append('vehicle_code', form.vehicle_code)
  if (form.plate_number) formData.append('plate_number', form.plate_number)
  if (form.vehicle_type_id !== undefined && form.vehicle_type_id !== null) {
    formData.append('vehicle_type_id', form.vehicle_type_id.toString())
  }
  
  // Add status only when editing
  if (props.mode === 'edit') {
    const status = form.status ?? true
    formData.append('status', status.toString())
  }
  
  // Add image if selected
  if (imageFile.value) {
    formData.append('image', imageFile.value)
  }
  
  emit('save', formData)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal 
    :open="props.open"
    :title="props.mode === 'add' ? 'Add New Vehicle' : 'Edit Vehicle'"
    :description="props.mode === 'add' ? 'Add a new vehicle to the system' : 'Update vehicle details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSave">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Vehicle Code" name="vehicle_code" required>
            <UInput v-model="form.vehicle_code" placeholder="VH-001" class="w-full" />
          </UFormField>
          
          <UFormField label="Plate Number" name="plate_number" required>
            <UInput v-model="form.plate_number" placeholder="B 1234 ABC" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Vehicle Type" name="vehicle_type_id" required>
          <USelect 
            v-model="form.vehicle_type_id" 
            :items="vehicleTypes.map((vt: DropdownOption) => ({ label: vt.name, value: vt.id }))" 
            placeholder="Select Vehicle Type" 
            class="w-full"
          />
        </UFormField>

        <UFormField label="Vehicle Image" name="image">
          <UFileUpload 
            v-model="imageFile"
            accept="image/jpeg,image/png,image/webp"
            label="Drop your vehicle image here"
            description="JPEG, PNG, or WebP. Max 5MB."
            :highlight="!!imageError"
            variant="area"
            class="min-h-32"
          />
          <p v-if="imageError" class="text-xs text-error-500 mt-1">
            {{ imageError }}
          </p>
        </UFormField>

        <UFormField v-if="props.mode === 'edit'" label="Status" name="status">
          <div class="flex items-center gap-2">
            <USwitch v-model="form.status" />
            <span class="text-sm">{{ form.status ? 'Active' : 'Inactive' }}</span>
          </div>
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
          :disabled="!!imageError"
          @click="handleSave"
        />
      </div>
    </template>
  </UModal>
</template>
