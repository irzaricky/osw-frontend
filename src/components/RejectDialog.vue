<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  required?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [reason: string]
  cancel: []
}>()

const reason = ref('')

watch(
  () => props.open,
  (val) => {
    if (val) {
      reason.value = ''
    }
  },
)

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}

function handleConfirm() {
  if (props.required && !reason.value.trim()) return

  emit('confirm', reason.value.trim())
}
</script>

<template>
  <UModal
    :open="props.open"
    @update:open="emit('update:open', $event)"
  >
    <!-- HEADER -->
    <template #header>
      <div class="w-full text-center space-y-2 py-2">
        <h3 class="text-lg font-semibold">
          {{ props.title || 'Reject Request' }}
        </h3>

        <p class="text-sm text-muted max-w-sm mx-auto leading-relaxed">
          {{
            props.description ||
            'Please provide the reason for rejection.'
          }}
        </p>
      </div>
    </template>

    <!-- BODY -->
    <template #body>
      <div class="space-y-2">
        <UFormField
          label="Rejection Reason"
          :required="props.required"
        >
          <UTextarea
            v-model="reason"
            :rows="4"
            class="w-full"
            placeholder="Enter rejection reason..."
          />
        </UFormField>
      </div>
    </template>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-3 w-full pt-2">
        <UButton
          :label="props.cancelLabel || 'Cancel'"
          color="neutral"
          variant="ghost"
          @click="handleCancel"
        />

        <UButton
          :label="props.confirmLabel || 'Reject'"
          color="error"
          :loading="props.loading"
          :disabled="props.required && !reason.trim()"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>