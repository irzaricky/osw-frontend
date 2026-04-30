<script setup lang="ts">
defineProps<{
  modelValue: string
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  scan: []
  scanQr: []
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-semibold">
        Scan Label Out
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <UInput
          :model-value="modelValue"
          icon="i-lucide-qr-code"
          placeholder="Scan / input label number"
          :disabled="disabled"
          @update:model-value="emit('update:modelValue', String($event))"
          @keyup.enter="emit('scan')"
        />

        <UButton
          icon="i-lucide-qr-code"
          variant="soft"
          color="neutral"
          label="Scan QR"
          :disabled="disabled"
          @click="emit('scanQr')"
        />
      </div>

      <UButton
        block
        color="primary"
        icon="i-lucide-package-x"
        label="Take Out Label"
        :loading="loading"
        :disabled="disabled || !modelValue"
        @click="emit('scan')"
      />
    </div>
  </UCard>
</template>