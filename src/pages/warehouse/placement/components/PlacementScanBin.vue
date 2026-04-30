<script setup lang="ts">
import type { PlacementBin, PlacementScanResult } from '../../../../types/warehouse/placement'

const props = defineProps<{
  binCode: string
  qtyPerKanban: number
  scannedLabel: PlacementScanResult | null
  availableBins: PlacementBin[]
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:binCode': [value: string]
  'update:qtyPerKanban': [value: number]
  place: []
  selectBin: [code: string]
  scanQr: []
}>()

function isBinDisabled(bin: PlacementBin) {
  if (bin.status === 'Full') return true

  const scannedPartNumber = props.scannedLabel?.part?.part_number

  if (bin.is_dedicated && bin.dedicated_part_number && bin.dedicated_part_number !== scannedPartNumber) {
    return true
  }

  return false
}

function getBinDisabledReason(bin: PlacementBin) {
  if (bin.status === 'Full') return 'Bin is full'

  const scannedPartNumber = props.scannedLabel?.part?.part_number

  if (bin.is_dedicated && bin.dedicated_part_number && bin.dedicated_part_number !== scannedPartNumber) {
    return `Dedicated for ${bin.dedicated_part_number}`
  }

  return ''
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-semibold">
        2. Scan Storage Bin
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-2">
        <UInput
          :model-value="binCode"
          icon="i-lucide-warehouse"
          placeholder="Scan / input bin code"
          :disabled="!scannedLabel"
          @update:model-value="emit('update:binCode', String($event))"
          @keyup.enter="emit('place')"
        />

        <!-- <UInput
          :model-value="qtyPerKanban"
          type="number"
          min="1"
          placeholder="Qty"
          :disabled="!scannedLabel"
          @update:model-value="emit('update:qtyPerKanban', Number($event || 1))"
        /> -->

        <UButton
          icon="i-lucide-qr-code"
          variant="soft"
          color="neutral"
          label="Scan QR"
          :disabled="!scannedLabel"
          @click="emit('scanQr')"
        />
      </div>

      <UButton
        block
        icon="i-lucide-package-check"
        label="Place to Bin"
        color="primary"
        :loading="loading"
        :disabled="!scannedLabel || !binCode"
        @click="emit('place')"
      />

      <div v-if="availableBins.length" class="space-y-2">
        <p class="text-sm font-medium">
          Available Bins
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            v-for="bin in availableBins"
            :key="bin.id"
            type="button"
            class="text-left rounded-xl border border-default p-3 transition"
            :class="isBinDisabled(bin)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-elevated'"
            :disabled="isBinDisabled(bin)"
            @click="emit('selectBin', bin.bin_code)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold">{{ bin.bin_code }}</p>

              <UBadge
                size="sm"
                variant="soft"
                :color="bin.status === 'Full' ? 'error' : bin.status === 'Empty' ? 'neutral' : 'success'"
              >
                {{ bin.status }}
              </UBadge>
            </div>

            <p class="text-xs text-muted mt-1">
              Capacity: {{ bin.used_capacity }} / {{ bin.capacity }}
            </p>

            <p v-if="bin.dedicated_part_number" class="text-xs text-muted">
              Dedicated: {{ bin.dedicated_part_number }}
            </p>

            <p v-if="isBinDisabled(bin)" class="text-xs text-error mt-1">
              {{ getBinDisabledReason(bin) }}
            </p>
          </button>
        </div>
      </div>
    </div>
  </UCard>
</template>