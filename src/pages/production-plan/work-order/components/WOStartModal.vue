<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { WorkOrder, MaterialCheckResponse, StartWorkOrderPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:          boolean
  wo:            WorkOrder
  loading:       boolean
  checkingStock: boolean
  materialCheck: MaterialCheckResponse | null
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'check':       []
  'confirm':     [payload: StartWorkOrderPayload]
}>()

const forceStart   = ref(false)
const shortageNote = ref('')

const hasShortage = computed(() =>
  props.materialCheck !== null && !props.materialCheck.all_sufficient,
)

// Start bisa dilakukan jika:
// 1. Stock sudah dicek dan semua cukup, atau
// 2. Stock sudah dicek, ada shortage, tapi forceStart diaktifkan
const canStart = computed(() => {
  if (!props.materialCheck) return false
  if (props.materialCheck.all_sufficient) return true
  return forceStart.value
})

watch(() => props.open, (v) => {
  if (v) {
    forceStart.value   = false
    shortageNote.value = ''
  }
})

function fmtDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function handleConfirm() {
  const payload: StartWorkOrderPayload = {}
  if (hasShortage.value && forceStart.value) {
    payload.force_start   = true
    payload.shortage_note = shortageNote.value.trim() || null
  }
  emit('confirm', payload)
}
</script>

<template>
  <UModal
    :open="open"
    title="Start Work Order"
    description="Review materials and confirm to start this Work Order."
    :ui="{ content: 'sm:max-w-lg' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">

        <!-- WO summary -->
        <div class="grid grid-cols-2 gap-3 p-4 bg-elevated rounded-lg">
          <div>
            <p class="text-xs text-muted">WO Number</p>
            <p class="text-sm font-semibold font-mono">{{ wo.wo_number }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Work Date</p>
            <p class="text-sm font-semibold">{{ fmtDate(wo.work_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Part</p>
            <p class="text-sm font-semibold">{{ wo.part?.part_name ?? '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-muted">Planned Qty</p>
            <p class="text-sm font-semibold font-mono">{{ wo.planned_quantity.toLocaleString() }}</p>
          </div>
        </div>

        <!-- Material check section -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold">Material Readiness</p>
            <UButton
              label="Check Stock"
              icon="i-lucide-scan-line"
              color="neutral"
              variant="soft"
              size="xs"
              :loading="checkingStock"
              @click="emit('check')"
            />
          </div>

          <div v-if="!materialCheck && !checkingStock" class="flex items-center gap-2 p-3 bg-elevated rounded-lg text-sm text-muted">
            <UIcon name="i-lucide-package" class="w-4 h-4 flex-shrink-0" />
            Click "Check Stock" to verify material availability before starting.
          </div>

          <div v-else-if="checkingStock" class="flex items-center gap-2 p-3 bg-elevated rounded-lg text-sm text-muted">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin flex-shrink-0" />
            Checking warehouse stock...
          </div>

          <UAlert
            v-else-if="materialCheck?.all_sufficient"
            color="success"
            variant="soft"
            icon="i-lucide-check-circle-2"
            title="All materials available"
            description="Warehouse stock meets all planned quantities. Material actuals have been pre-filled."
          />

          <div v-else-if="materialCheck && !materialCheck.all_sufficient" class="space-y-2">
            <UAlert
              color="error"
              variant="soft"
              icon="i-lucide-package-x"
              :title="`${materialCheck.shortage_count} material shortage(s) detected`"
              description="Actual quantities have been pre-filled with available stock. Shortages will be recorded as issues per station."
            />

            <div class="rounded-lg border border-default overflow-hidden">
              <table class="w-full text-xs">
                <thead class="bg-elevated border-b border-default">
                  <tr>
                    <th class="text-left px-3 py-2 text-muted font-semibold uppercase tracking-wide">Part</th>
                    <th class="text-right px-3 py-2 text-muted font-semibold uppercase tracking-wide">Required</th>
                    <th class="text-right px-3 py-2 text-muted font-semibold uppercase tracking-wide">In Stock</th>
                    <th class="text-right px-3 py-2 text-muted font-semibold uppercase tracking-wide">Shortage</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr
                    v-for="m in materialCheck.materials"
                    :key="m.id"
                    :class="!m.sufficient ? 'bg-error-50/50 dark:bg-error-950/20' : ''"
                  >
                    <td class="px-3 py-2">
                      <div class="font-medium">{{ m.material_part?.part_name ?? '-' }}</div>
                      <div class="text-muted font-mono">{{ m.material_part?.part_number }}</div>
                    </td>
                    <td class="px-3 py-2 text-right font-mono">{{ Number(m.planned_quantity ?? 0).toLocaleString() }}</td>
                    <td class="px-3 py-2 text-right font-mono" :class="m.sufficient ? 'text-success-600' : 'text-error-600'">
                      {{ Number(m.current_stock ?? 0).toLocaleString() }}
                    </td>
                    <td class="px-3 py-2 text-right font-mono font-semibold" :class="(m.shortage ?? 0) > 0 ? 'text-error-600' : 'text-muted'">
                      {{ (m.shortage ?? 0) > 0 ? `-${Number(m.shortage).toLocaleString()}` : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Force start acknowledgement -->
            <div class="p-3 border border-warning-300 dark:border-warning-700 bg-warning-50 dark:bg-warning-950/30 rounded-lg space-y-2">
              <label class="flex items-start gap-2.5 cursor-pointer">
                <UCheckbox v-model="forceStart" class="mt-0.5 flex-shrink-0" />
                <span class="text-sm font-medium text-warning-700 dark:text-warning-400">
                  I acknowledge the shortage and want to start anyway. A material issue will be recorded on each affected station.
                </span>
              </label>
              <UInput
                v-if="forceStart"
                v-model="shortageNote"
                placeholder="Optional: add a note about the shortage (e.g. material en route)..."
                class="w-full text-sm"
              />
            </div>
          </div>
        </div>

        <!-- Koreksi: semua stasiun langsung In_Progress bersamaan (assembly line model) -->
        <UAlert
          color="info"
          variant="soft"
          icon="i-lucide-info"
          description="All process stations will be activated simultaneously. Each station operator can report progress and complete their station independently."
        />
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Start Work Order"
          icon="i-lucide-play"
          :color="hasShortage && forceStart ? 'warning' : 'primary'"
          :disabled="!canStart"
          :loading="loading"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>