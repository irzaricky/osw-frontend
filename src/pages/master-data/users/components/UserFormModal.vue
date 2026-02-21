<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { User } from '../../../../types'
import type { DropdownOption } from '../composables/useUserDropdowns'

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  user: Partial<User>
  roles: DropdownOption[]
  factories: DropdownOption[]
  lines: DropdownOption[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:factory-id': [value: number]
  save: [data: Partial<User>]
}>()

const form = reactive<Partial<User>>({})

// Sync form when user prop changes (on modal open)
watch(() => props.user, (val) => {
  // Clear existing keys to avoid stale data
  for (const key in form) {
    delete form[key as keyof Partial<User>]
  }
  Object.assign(form, val)
  
  // Extract role_id from nested role object if needed
  if (!form.role_id && val.role?.id) {
    form.role_id = val.role.id
  }
}, { immediate: true, deep: true })

// Watch for modal open to ensure fresh form in add mode
watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'add') {
    // Clear all form fields
    for (const key in form) {
      delete form[key as keyof Partial<User>]
    }
    // Reset to empty user
    Object.assign(form, props.user)
  }
})

// Watch factory_id to emit update
watch(() => form.factory_id, (val) => {
  if (val) emit('update:factory-id', val)
})

function handleSave() {
  emit('save', { ...form })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal 
    :open="props.open"
    :title="props.mode === 'add' ? 'Add New User' : 'Edit User'"
    :description="props.mode === 'add' ? 'Add a new user to the system' : 'Update user details'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSave">
        <div class="grid grid-cols-1 gap-4" />
        
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="form.email"
            type="email"
            placeholder="john@example.com"
            class="w-full"
          />
        </UFormField>
        
        <UFormField label="Password" name="password" :required="props.mode === 'add'">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="********"
            class="w-full"
          />
          <p v-if="props.mode === 'edit'" class="text-xs text-muted mt-1">
            Leave blank to keep current password
          </p>
        </UFormField>
        
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Full Name" name="full_name">
            <UInput v-model="form.full_name" placeholder="John Doe" class="w-full" />
          </UFormField>
          
          <UFormField label="Phone Number" name="phone_number">
            <UInput v-model="form.phone_number" placeholder="+1234567890" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Role" name="role_id" required>
          <USelect 
            v-model="form.role_id" 
            :items="roles.map((r: DropdownOption) => ({ label: r.name, value: r.id }))" 
            placeholder="Select Role" 
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Factory" name="factory_id">
            <USelect 
              v-model="form.factory_id" 
              :items="[{ label: 'None', value: null }, ...factories.map((f: DropdownOption) => ({ label: f.name, value: f.id }))]" 
              placeholder="Select Factory" 
              class="w-full"
            />
          </UFormField>
          
          <UFormField label="Line" name="line_id">
            <USelect 
              v-model="form.line_id" 
              :items="lines.map((l: DropdownOption) => ({ label: l.name, value: l.id }))" 
              placeholder="Select Line" 
              :disabled="!form.factory_id"
              class="w-full"
            />
          </UFormField>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end w-full gap-2">
        <UButton
          color="neutral"
          variant="outline"
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
