<script setup lang="ts">
import type { AvailableDO } from '../../../../types/production-plan/plan'

defineProps<{
  isCreate: boolean
  isDetail: boolean
  currentPlan: any
  headerForm: { plan_description: string; notes: string }
  saving: boolean
  fmtDate: (d?: string | null) => string
  fmtNum: (n?: number | null) => string
  pendingDos: AvailableDO[]
  doReferences: any[]
}>()

const emit = defineEmits<{ 
  (e: 'open-do-modal'): void
  (e: 'remove-pending', id: number): void
  (e: 'remove-do', id: number): void
}>()
</script>

<template>
  <div class="bg-default border border-default rounded-xl">
    <!-- Card header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-default">
      <h2 class="font-semibold text-sm flex items-center gap-2">
        <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-primary" />
        Plan Info
      </h2>
      <UBadge v-if="isCreate" label="New" color="primary" variant="soft" size="sm" />
      <UBadge v-else-if="isDetail" label="Edit Mode" color="warning" variant="soft" size="sm" />
    </div>

    <!-- Info bar (detail/edit mode only) -->
    <div
      v-if="!isCreate && currentPlan"
      class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 divide-x divide-default border-b border-default"
    >
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Plan Number</p>
        <p class="text-sm font-semibold font-mono">{{ currentPlan.plan_number }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Earliest Delivery</p>
        <p class="text-sm font-semibold">{{ fmtDate(currentPlan.earliest_delivery_date) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Latest Delivery</p>
        <p class="text-sm font-semibold">{{ fmtDate(currentPlan.latest_delivery_date) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Total Product</p>
        <p class="text-sm font-semibold">{{ fmtNum(currentPlan.total_products) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Total Requested Qty</p>
        <p class="text-sm font-semibold">{{ fmtNum(currentPlan.total_qty_request) }}</p>
      </div>
      <div class="px-4 py-3 space-y-0.5">
        <p class="text-xs text-muted">Total Available Qty</p>
        <p
          class="text-sm font-semibold"
          :class="{
            'text-success-600': (currentPlan.total_qty_capacity ?? 0) >= currentPlan.total_qty_request,
            'text-error-600': (currentPlan.total_qty_capacity ?? 0) < currentPlan.total_qty_request,
          }"
        >
          {{ fmtNum(currentPlan.total_qty_capacity) }}
        </p>
      </div>
    </div>

    <!-- Form fields -->
    <div class="px-5 py-4 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Plan Description">
          <UInput
            v-model="headerForm.plan_description"
            placeholder="Example: March 2026 Production Batch"
            class="w-full"
            :disabled="(!isCreate && !isDetail) || saving"
          />
        </UFormField>
        <UFormField label="Notes">
          <UInput
            v-model="headerForm.notes"
            placeholder="Additional notes (optional)"
            class="w-full"
            :disabled="(!isCreate && !isDetail) || saving"
          />
        </UFormField>
      </div>

      <!-- DO reference row (detail/edit) -->
      <div v-if="!isCreate && doReferences.length" class="space-y-1.5">
        <p class="text-xs text-muted font-medium flex items-center gap-1.5">
          <UIcon name="i-lucide-link-2" class="w-3.5 h-3.5" />
          Delivery Order References
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ref in doReferences"
            :key="ref.id"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border border-default text-default"
          >
            {{ ref.delivery_order?.do_number ?? `DO #${ref.do_id}` }}
            <UIcon
              v-if="isDetail"
              name="i-lucide-x"
              class="w-3 h-3 cursor-pointer text-muted hover:text-error-500"
              @click="$emit('remove-do', ref.do_id)"
            />
          </span>
          <UBadge
            v-for="doItem in (pendingDos ?? [])"
            :key="`pending-${doItem.id}`"
            :label="doItem.do_number"
            color="primary"
            variant="soft"
          >
            <template #trailing>
              <UIcon
                name="i-lucide-x"
                class="w-3 h-3 cursor-pointer"
                @click="$emit('remove-pending', doItem.id)"
              />
            </template>
          </UBadge>
          <UButton
            v-if="isDetail"
            label="+ Add DO"
            size="xs"
            color="neutral"
            variant="soft"
            class="ml-1 rounded"
            @click="$emit('open-do-modal')"
          />
        </div>
      </div>
    </div>
  </div>
</template>