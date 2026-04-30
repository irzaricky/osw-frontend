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
  error.value = err?.message || 'Camera error'
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">
              {{ title || 'Scan QR Code' }}
            </h3>

            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              @click="emit('update:open', false)"
            />
          </div>
        </template>

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
            Pastikan browser memberi izin kamera.
          </p>
        </div>
      </UCard>
    </template>
  </UModal>
</template>