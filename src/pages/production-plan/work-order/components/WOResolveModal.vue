<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAuthStore }    from '../../../../stores/auth.store'
import type { ResolveIssuePayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:    boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: ResolveIssuePayload]
}>()

const authStore = useAuthStore()

const form = reactive({
  resolution: '',
})

const errors = reactive({
  resolution: '',
  session:    '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.resolution  = ''
    errors.resolution = ''
    errors.session    = ''
  }
})

function validate(): boolean {
  let valid = true
  errors.resolution = ''
  errors.session    = ''
  if (!form.resolution.trim()) { errors.resolution = 'Resolution details are required.'; valid = false }
  if (!authStore.user?.id)     { errors.session    = 'User session not found. Please refresh and try again.'; valid = false }
  return valid
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    resolution:  form.resolution.trim(),
    resolved_by: authStore.user!.id,
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

        <UAlert
          v-if="errors.session"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :description="errors.session"
        />
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