<script setup lang="ts">
import type { TakeOutRecommendation } from '../../../../types/warehouse/take-out'

defineProps<{
  recommendation: TakeOutRecommendation
}>()

const emit = defineEmits<{
  selectLabel: [labelNumber: string]
}>()
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
              Placement At:
              {{
                recommendation.recommended_label.placement_at
                  ? new Date(recommendation.recommended_label.placement_at).toLocaleString()
                  : '-'
              }}
            </p>
          </div>

          <UButton
            size="sm"
            icon="i-lucide-arrow-right"
            label="Use"
            @click="emit('selectLabel', recommendation.recommended_label.label_number)"
          />
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-medium">
          Available Bins
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
              v-for="stock in bin.stocks"
              :key="stock.stock_id"
              class="rounded-lg border border-default p-2 text-sm"
              :class="stock.is_target_part ? 'bg-primary/5' : 'opacity-70'"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="font-medium truncate">
                  {{ stock.label_number }}
                </p>

                <UBadge
                  size="sm"
                  variant="soft"
                  :color="stock.is_target_part ? 'primary' : 'neutral'"
                >
                  {{ stock.is_target_part ? 'Target' : 'Other' }}
                </UBadge>
              </div>

              <p class="text-xs text-muted">
                {{ stock.part_number }} - {{ stock.part_name }}
              </p>
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
  </UCard>
</template>