<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TakeOutRecommendation } from '../../../../types/warehouse/take-out'

const props = defineProps<{
  recommendation: TakeOutRecommendation
}>()

const emit = defineEmits<{
  selectLabel: [{
    labelNumber: string
    fifoOverride: boolean
  }]
}>()

const confirmOpen = ref(false)
const selectedNonFifoLabel = ref<string | null>(null)

const recommendedLabelNumber = computed(() => {
  return props.recommendation.recommended_label?.label_number
})

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function isRecommendedLabel(labelNumber?: string | null) {
  return !!labelNumber && labelNumber === recommendedLabelNumber.value
}

function useRecommendedLabel() {
  if (!recommendedLabelNumber.value) return
  emit('selectLabel', {
  labelNumber: recommendedLabelNumber.value,
  fifoOverride: false
})
}

function requestUseLabel(labelNumber?: string | null) {
  if (!labelNumber) return

  if (isRecommendedLabel(labelNumber)) {
    emit('selectLabel', {
      labelNumber,
      fifoOverride: false
    })
    return
  }

  selectedNonFifoLabel.value = labelNumber
  confirmOpen.value = true
}

function confirmUseNonFifoLabel() {
  if (!selectedNonFifoLabel.value) return

  emit('selectLabel', {
    labelNumber: selectedNonFifoLabel.value,
    fifoOverride: true
  })
  confirmOpen.value = false
  selectedNonFifoLabel.value = null
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="font-semibold">
            FIFO Recommendation
          </p>
          <p class="text-xs text-muted">
            {{ recommendation.part_number }} - {{ recommendation.part_name }}
          </p>
        </div>

        <UBadge
          v-if="recommendation.recommended_label"
          color="success"
          variant="soft"
        >
          Recommended
        </UBadge>
      </div>
    </template>

    <div v-if="recommendation.recommended_label" class="space-y-4">
      <div class="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p class="text-sm text-muted">
          Recommended Label
        </p>

        <div class="flex items-center justify-between gap-3 mt-1">
          <div>
            <p class="font-bold">
              {{ recommendation.recommended_label.label_number }}
            </p>

            <p class="text-xs text-muted">
              Bin: {{ recommendation.recommended_label.bin_code }}
            </p>

            <p class="text-xs text-muted">
              Placement At: {{ formatDateTime(recommendation.recommended_label.placement_at) }}
            </p>
          </div>

          <UButton
            size="sm"
            icon="i-lucide-arrow-right"
            label="Use"
            @click="useRecommendedLabel"
          />
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium">
          Available Stock Labels
        </p>

        <div
          v-for="bin in recommendation.bins"
          :key="bin.bin_id"
          class="rounded-xl border border-default p-4 space-y-3"
          :class="bin.is_recommended_bin ? 'ring-1 ring-primary/40' : ''"
        >
          <div class="flex items-center justify-between">
            <p class="font-semibold">
              {{ bin.bin_code }}
            </p>

            <UBadge
              v-if="bin.is_recommended_bin"
              size="sm"
              color="success"
              variant="soft"
            >
              FIFO Bin
            </UBadge>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="stock in bin.stocks.filter(stock => stock.is_target_part)"
              :key="stock.stock_id"
              class="rounded-lg border border-default p-3 text-sm"
              :class="stock.is_target_part ? 'bg-primary/5' : 'opacity-70'"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium truncate">
                    {{ stock.label_number }}
                  </p>

                  <p class="text-xs text-muted">
                    {{ stock.part_number }} - {{ stock.part_name }}
                  </p>

                  <p class="text-xs text-muted mt-1">
                    Placement At: {{ formatDateTime(stock.placement_at) }}
                  </p>
                </div>

                <div class="flex flex-col items-end gap-2 shrink-0">
                  <UBadge
                    size="sm"
                    variant="soft"
                    :color="isRecommendedLabel(stock.label_number) ? 'success' : stock.is_target_part ? 'primary' : 'neutral'"
                  >
                    {{ isRecommendedLabel(stock.label_number) ? 'Recommended' : stock.is_target_part ? 'Target' : 'Other' }}
                  </UBadge>

                  <UButton
                    v-if="stock.is_target_part"
                    size="xs"
                    variant="soft"
                    icon="i-lucide-arrow-right"
                    label="Use"
                    @click="requestUseLabel(stock.label_number)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UAlert
      v-else
      color="warning"
      variant="soft"
      icon="i-lucide-alert-triangle"
      title="No Stock Available"
      description="No active stock found for this requested part."
    />

    <UModal v-model:open="confirmOpen">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-alert-triangle" class="text-warning size-5" />
              <p class="font-semibold">
                Non-FIFO Take Out
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <p class="text-sm">
              Label yang kamu pilih bukan label yang direkomendasikan oleh FIFO.
            </p>

            <div class="rounded-lg border border-default p-3 text-sm space-y-1">
              <p>
                <span class="text-muted">Recommended:</span>
                <span class="font-semibold">{{ recommendedLabelNumber || '-' }}</span>
              </p>
              <p>
                <span class="text-muted">Selected:</span>
                <span class="font-semibold">{{ selectedNonFifoLabel || '-' }}</span>
              </p>
            </div>

            <UAlert
              color="warning"
              variant="soft"
              icon="i-lucide-info"
              title="FIFO Warning"
              description="Apakah kamu yakin ingin mengambil part yang tidak mengikuti urutan FIFO?"
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="soft"
                label="Cancel"
                @click="confirmOpen = false"
              />

              <UButton
                color="warning"
                icon="i-lucide-check"
                label="Yes, Continue"
                @click="confirmUseNonFifoLabel"
              />
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </UCard>
</template>