<script setup lang="ts">
import { ref } from 'vue'
import { QrcodeStream } from 'vue-qrcode-reader'

defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  scanned: [value: string]
}>()

const error = ref('')

function onDetect(detectedCodes: any[]) {
  const value = detectedCodes?.[0]?.rawValue

  if (!value) return

  emit('scanned', value)
  emit('update:open', false)
}

function onError(err: any) {
  error.value = err?.message || 'Failed to access camera.'
}
</script>

<template>
  <UModal
    :open="open"
    title="Scan Label"
    description="Scan QR code using your device camera"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <QrcodeStream
          class="rounded-xl overflow-hidden"
          @detect="onDetect"
          @error="onError"
        />

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          title="Scanner Error"
          :description="error"
        />

        <p class="text-xs text-muted">
          Please make sure camera access is allowed in your browser.
        </p>
      </div>
    </template>
  </UModal>
</template>