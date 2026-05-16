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

const scannedPartNumber = computed(() =>
  props.scannedLabel?.part?.part_number || ''
)

const scannedPartCategory = computed(() =>
  String(props.scannedLabel?.part?.part_category || '').trim().toUpperCase()
)

function getBinRestriction(bin: PlacementBin) {
  if (bin.is_dedicated && bin.dedicated_part_number) {
    return `Dedicated: ${bin.dedicated_part_number}`
  }

  if (bin.allowed_part_category) {
    return `${bin.allowed_part_category} Only`
  }

  return 'Free Bin'
}

function getDisabledReason(bin: PlacementBin) {
  if (bin.status === 'Unconfigured') {
    return 'Safe capacity not configured'
  }

  if (bin.status === 'Full') {
    return 'Bin is full'
  }

  if (
    bin.is_dedicated &&
    bin.dedicated_part_number &&
    bin.dedicated_part_number !== scannedPartNumber.value
  ) {
    return `Dedicated to ${bin.dedicated_part_number}`
  }

  const allowedCategory = String(bin.allowed_part_category || '').trim().toUpperCase()

  if (
    allowedCategory &&
    scannedPartCategory.value &&
    allowedCategory !== scannedPartCategory.value
  ) {
    return `${allowedCategory} only`
  }

  return ''
}

function isBinDisabled(bin: PlacementBin) {
  return Boolean(getDisabledReason(bin))
}

// function getBinPriority(bin: PlacementBin) {
//   const scannedPartNumber =
//     props.scannedLabel?.part?.part_number || ''

//   const scannedPartCategory =
//     String(props.scannedLabel?.part?.part_category || '')
//       .trim()
//       .toUpperCase()

//   // exact dedicated match
//   if (
//     bin.is_dedicated &&
//     bin.dedicated_part_number === scannedPartNumber
//   ) {
//     return 100
//   }

//   // same category
//   if (
//     bin.allowed_part_category &&
//     String(bin.allowed_part_category)
//       .trim()
//       .toUpperCase() === scannedPartCategory
//   ) {
//     return 70
//   }

//   // free bin
//   if (
//     !bin.is_dedicated &&
//     !bin.allowed_part_category
//   ) {
//     return 50
//   }

//   return 0
// }

const selectableBins = computed(() => {
  const bins = uniqueBins.value.filter(bin => !isBinDisabled(bin))

  const exactDedicatedBins = bins.filter(bin =>
    bin.is_dedicated &&
    bin.dedicated_part_number === scannedPartNumber.value
  )

  if (exactDedicatedBins.length) {
    return exactDedicatedBins
  }

  const categoryBins = bins.filter(bin =>
    !bin.is_dedicated &&
    bin.allowed_part_category &&
    String(bin.allowed_part_category).trim().toUpperCase() === scannedPartCategory.value
  )

  if (categoryBins.length) {
    return categoryBins
  }

  const freeBins = bins.filter(bin =>
    !bin.is_dedicated &&
    !bin.allowed_part_category
  )

  return freeBins.slice(0, 1)
})

const uniqueBins = computed(() => {
  const map = new Map<string, PlacementBin>()

  for (const bin of props.availableBins || []) {
    if (!map.has(bin.bin_code)) {
      map.set(bin.bin_code, bin)
    }
  }

  return Array.from(map.values())
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
              <p class="font-semibold">
                {{ bin.bin_code }}
              </p>

              <UBadge
                size="sm"
                variant="soft"
                :color="bin.status === 'Free' ? 'neutral' : 'success'"
              >
                {{ bin.status }}
              </UBadge>
            </div>

            <p class="text-xs text-muted mt-1">
              Safe Capacity:
              {{ bin.used_capacity }} / {{ bin.capacity }}
            </p>

            <p class="text-xs text-muted">
              {{ getBinRestriction(bin) }}
            </p>

            <p
              v-if="bin.remaining_capacity !== null && bin.remaining_capacity !== undefined"
              class="text-xs text-muted"
            >
              Remaining: {{ bin.remaining_capacity }} label(s)
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