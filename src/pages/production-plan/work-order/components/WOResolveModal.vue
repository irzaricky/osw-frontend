<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { ResolveIssuePayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: ResolveIssuePayload]
}>()

const form = reactive({
  resolution:  '',
  resolved_by: '',
})

const errors = reactive({
  resolution:  '',
  resolved_by: '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.resolution  = ''
    form.resolved_by = ''
    errors.resolution  = ''
    errors.resolved_by = ''
  }
})

function validate(): boolean {
  let valid = true
  errors.resolution  = ''
  errors.resolved_by = ''
  if (!form.resolution.trim())  { errors.resolution  = 'Resolution details are required.'; valid = false }
  if (!form.resolved_by.trim()) { errors.resolved_by = 'Resolver name is required.'; valid = false }
  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    resolution:  form.resolution.trim(),
    resolved_by: form.resolved_by.trim(),
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Resolve Issue"
    description="Provide resolution details for this issue."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Resolution" :error="errors.resolution" required>
          <UTextarea
            v-model="form.resolution"
            placeholder="Describe how the issue was resolved..."
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Resolved By" :error="errors.resolved_by" required>
          <UInput
            v-model="form.resolved_by"
            placeholder="Your name or employee ID..."
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Mark as Resolved"
          icon="i-lucide-check"
          color="success"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>