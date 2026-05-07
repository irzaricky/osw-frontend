<script setup lang="ts">
import { computed } from 'vue'
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

  if (
    bin.is_dedicated &&
    bin.dedicated_part_number &&
    bin.dedicated_part_number !== scannedPartNumber
  ) {
    return true
  }

  return false
}


const selectableBins = computed(() => {
  return props.availableBins.filter(bin => !isBinDisabled(bin))
})


</script>

<template>
  <UCard>
    <template #header>
      <div class="font-semibold">
        2. Scan Storage Bin
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <UInput
          :model-value="binCode"
          icon="i-lucide-warehouse"
          placeholder="Scan / input bin code"
          :disabled="!scannedLabel"
          @update:model-value="emit('update:binCode', String($event))"
          @keyup.enter="emit('place')"
        />

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

      <div v-if="selectableBins.length" class="space-y-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium">
            Available Bins
          </p>

          <UBadge size="sm" color="success" variant="soft">
            {{ selectableBins.length }} selectable
          </UBadge>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            v-for="bin in selectableBins"
            :key="bin.id"
            type="button"
            class="text-left rounded-xl border border-primary/30 bg-primary/5 p-3 transition hover:bg-primary/10"
            @click="emit('selectBin', bin.bin_code)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold">{{ bin.bin_code }}</p>

              <UBadge
                size="sm"
                variant="soft"
                :color="bin.status === 'Empty' ? 'neutral' : 'success'"
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
          </button>
        </div>
      </div>

      <UAlert
        v-else-if="scannedLabel"
        color="warning"
        variant="soft"
        icon="i-lucide-alert-triangle"
        title="No Available Bin"
        description="No selectable bin is available for this part in the selected warehouse area."
      />

      
      </div>
  </UCard>
</template>