<script setup lang="ts">
import type { PlacementScanResult } from '../../../../types/warehouse/placement'

defineProps<{
  modelValue: string
  scannedLabel: PlacementScanResult | null
  loading?: boolean
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
        1. Scan Part Label
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <UInput :model-value="modelValue" icon="i-lucide-qr-code" placeholder="Scan / input part label number"
          @update:model-value="emit('update:modelValue', String($event))" @keyup.enter="emit('scan')" />

        <UButton icon="i-lucide-qr-code" variant="soft" color="neutral" label="Scan QR" @click="emit('scanQr')" />
      </div>

      <UButton block color="primary" icon="i-lucide-scan-line" label="Validate Part Label" :loading="loading"
        :disabled="!modelValue" @click="emit('scan')" />

      <UAlert v-if="scannedLabel" color="success" variant="soft" icon="i-lucide-check-circle" title="Label Valid">
        <template #description>
          <div class="space-y-1">
            <p><span class="text-muted">Label:</span> {{ scannedLabel.label_number }}</p>
            <p><span class="text-muted">Part Number:</span> {{ scannedLabel.part?.part_number }}</p>
            <p><span class="text-muted">Part Name:</span> {{ scannedLabel.part?.part_name }}</p>
            <p><span class="text-muted">Category:</span> {{ scannedLabel.part?.part_category || '-' }}</p>
            <p>
              <span class="text-muted">Package:</span>
              {{ scannedLabel.part?.package?.name || scannedLabel.part?.package_code || '-' }}
            </p>
            <p>
              <span class="text-muted">Capacity:</span>
              {{ scannedLabel.part?.package?.capacity || 0 }} pcs / kanban
            </p>
          </div>
        </template>
      </UAlert>
    </div>
  </UCard>
</template>