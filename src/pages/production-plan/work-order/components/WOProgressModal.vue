<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useAuthStore } from '../../../../stores/auth.store'
import type { AddProgressPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:                    boolean
  plannedQty:              number
  currentCumulativeGood:   number
  currentCumulativeReject: number
  currentCumulativeScrap:  number
  upstreamActualQty?:      number | null
  loading:                 boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: AddProgressPayload]
}>()

const authStore = useAuthStore()

const form = reactive({
  qty_good:   0,
  qty_reject: 0,
  qty_scrap:  0,
  reason:     '',
})

const errors = reactive({
  qty_good:   '',
  qty_reject: '',
  qty_scrap:  '',
  total:      '',
  upstream:   '',
  reason:     '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.qty_good   = 0
    form.qty_reject = 0
    form.qty_scrap  = 0
    form.reason     = ''
    Object.keys(errors).forEach((k) => (errors[k as keyof typeof errors] = ''))
  }
})

const isCorrection  = computed(() => form.qty_good < 0)
const maxAllowed    = computed(() => Math.ceil(props.plannedQty * 1.1))
const upstreamMaxQty = computed(() => props.upstreamActualQty ?? maxAllowed.value)

const newCumGood   = computed(() => props.currentCumulativeGood   + form.qty_good)
const newCumReject = computed(() => props.currentCumulativeReject + form.qty_reject)
const newCumScrap  = computed(() => props.currentCumulativeScrap  + form.qty_scrap)
const newCumTotal  = computed(() => newCumGood.value + newCumReject.value + newCumScrap.value)

const progressPct = computed(() => {
  if (!props.plannedQty) return 0
  return Math.min(110, Math.round((newCumGood.value / props.plannedQty) * 100))
})

const currentPct = computed(() => {
  if (!props.plannedQty) return 0
  return Math.min(100, Math.round((props.currentCumulativeGood / props.plannedQty) * 100))
})

const progressBarColor = computed(() => {
  if (isCorrection.value)           return 'bg-warning-500'
  if (progressPct.value >= 100)     return 'bg-success-500'
  if (progressPct.value >= 60)      return 'bg-primary-500'
  if (progressPct.value >= 30)      return 'bg-warning-500'
  return 'bg-error-400'
})

const willExceedUpstream = computed(() =>
  !isCorrection.value && newCumGood.value > upstreamMaxQty.value
)

function validate(): boolean {
  Object.keys(errors).forEach((k) => (errors[k as keyof typeof errors] = ''))
  let valid = true

  if (form.qty_reject < 0) { errors.qty_reject = 'Cannot be negative.'; valid = false }
  if (form.qty_scrap  < 0) { errors.qty_scrap  = 'Cannot be negative.'; valid = false }

  if (form.qty_good === 0 && form.qty_reject === 0 && form.qty_scrap === 0) {
    errors.qty_good = 'At least one quantity field must be non-zero.'
    valid = false
  }

  // Koreksi negatif: wajib reason, cumulative tidak boleh negatif
  if (isCorrection.value) {
    if (!form.reason.trim()) {
      errors.reason = 'Reason is required for corrections.'
      valid = false
    }
    if (newCumGood.value < 0) {
      errors.qty_good = `Correction would result in negative cumulative (${newCumGood.value}).`
      valid = false
    }
    return valid
  }

  // Progress normal: validasi 110% dan upstream
  if (newCumTotal.value > maxAllowed.value) {
    errors.total = `Cumulative total (${newCumTotal.value}) would exceed 110% of planned (max: ${maxAllowed.value}).`
    valid = false
  }

  if (willExceedUpstream.value) {
    errors.upstream = `Cumulative good (${newCumGood.value}) would exceed upstream output (${upstreamMaxQty.value}).`
    errors.qty_good = `Max allowed: ${upstreamMaxQty.value - props.currentCumulativeGood} more unit(s).`
    valid = false
  }

  if (!willExceedUpstream.value && newCumGood.value > maxAllowed.value) {
    errors.qty_good = `Cumulative good (${newCumGood.value}) would exceed 110% of planned (max: ${maxAllowed.value}).`
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validate()) return
  const userId = authStore.user?.id
  if (!userId) {
    errors.qty_good = 'User session not found. Please refresh and try again.'
    return
  }
  emit('submit', {
    qty_good:    form.qty_good,
    qty_reject:  form.qty_reject || undefined,
    qty_scrap:   form.qty_scrap  || undefined,
    reported_by: userId,
    reason:      form.reason || undefined,
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="isCorrection ? 'Correct Progress' : 'Report Progress'"
    :description="isCorrection ? 'Enter a negative qty_good to reduce cumulative.' : 'Record production output for this station.'"
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">

        <div v-if="upstreamActualQty != null" class="p-3 bg-info-50 dark:bg-info-950/30 border border-info-200 dark:border-info-800 rounded-lg">
          <p class="text-xs font-semibold text-info-700 dark:text-info-400 flex items-center gap-1">
            <UIcon name="i-lucide-info" class="w-3 h-3" /> Upstream Constraint
          </p>
          <p class="text-xs text-info-700 dark:text-info-400 mt-0.5">
            Max <span class="font-mono font-bold">{{ upstreamActualQty }}</span> total unit(s) can be processed at this station (based on upstream good output).
          </p>
        </div>

        <!-- Correction mode alert -->
        <UAlert
          v-if="isCorrection"
          color="warning"
          variant="soft"
          icon="i-lucide-pencil"
          title="Correction Mode"
          description="A negative qty will reduce the cumulative good count. Reason is required."
        />

        <div class="p-3 bg-elevated rounded-lg space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Cumulative Good</span>
            <span class="font-mono font-semibold">
              {{ currentCumulativeGood.toLocaleString() }} / {{ plannedQty.toLocaleString() }}
            </span>
          </div>
          <div class="w-full h-1.5 bg-default rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="progressBarColor"
              :style="{ width: `${currentPct}%` }"
            />
          </div>
          <div class="flex items-center gap-4 text-xs text-muted">
            <span>Reject: <span class="font-mono font-semibold text-warning-600">{{ currentCumulativeReject.toLocaleString() }}</span></span>
            <span>Scrap: <span class="font-mono font-semibold text-error-600">{{ currentCumulativeScrap.toLocaleString() }}</span></span>
          </div>
        </div>

        <UFormField label="Qty Good (negative for correction)" :error="errors.qty_good" required>
          <UInput
            v-model.number="form.qty_good"
            type="number"
            placeholder="0"
            class="w-full font-mono"
          />
          <template #hint>
            <span
              class="text-xs"
              :class="{
                'text-error-600':   newCumGood < 0 || willExceedUpstream,
                'text-warning-500': isCorrection && newCumGood >= 0,
                'text-success-600': !isCorrection && newCumGood <= plannedQty,
                'text-muted':       true,
              }"
            >
              New cumulative: <span class="font-semibold font-mono">{{ newCumGood.toLocaleString() }}</span>
              ({{ progressPct }}% of planned)
            </span>
          </template>
        </UFormField>

        <!-- Reason — hanya muncul jika koreksi -->
        <UFormField v-if="isCorrection" label="Correction Reason" :error="errors.reason" required>
          <UTextarea
            v-model="form.reason"
            placeholder="Explain why this correction is needed..."
            :rows="2"
            class="w-full"
          />
        </UFormField>

        <div v-if="!isCorrection" class="grid grid-cols-2 gap-3">
          <UFormField label="Qty Reject (NG)" :error="errors.qty_reject">
            <UInput v-model.number="form.qty_reject" type="number" min="0" placeholder="0" class="w-full font-mono" />
            <template #hint>
              <span class="text-xs text-muted">Cumulative: {{ newCumReject.toLocaleString() }}</span>
            </template>
          </UFormField>
          <UFormField label="Qty Scrap" :error="errors.qty_scrap">
            <UInput v-model.number="form.qty_scrap" type="number" min="0" placeholder="0" class="w-full font-mono" />
            <template #hint>
              <span class="text-xs text-muted">Cumulative: {{ newCumScrap.toLocaleString() }}</span>
            </template>
          </UFormField>
        </div>

        <div
          v-if="!isCorrection"
          class="flex items-center justify-between p-2.5 rounded-lg text-xs"
          :class="newCumTotal > maxAllowed ? 'bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-400' : 'bg-elevated text-muted'"
        >
          <span>Total processed after this report</span>
          <span class="font-mono font-semibold">{{ newCumTotal.toLocaleString() }} / {{ maxAllowed.toLocaleString() }} (110%)</span>
        </div>

        <UAlert v-if="errors.upstream" color="error" variant="soft" icon="i-lucide-alert-circle" :description="errors.upstream" />
        <UAlert v-if="errors.total"    color="error" variant="soft" icon="i-lucide-alert-circle" :description="errors.total" />
        <UAlert v-if="errors.reason"   color="error" variant="soft" icon="i-lucide-alert-circle" :description="errors.reason" />

        <div v-if="!isCorrection" class="space-y-1">
          <div class="flex items-center justify-between text-xs text-muted">
            <span>Good qty after this report</span>
            <span class="font-mono font-semibold">{{ progressPct }}%</span>
          </div>
          <div class="w-full h-2 bg-elevated rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="progressBarColor"
              :style="{ width: `${Math.min(100, progressPct)}%` }"
            />
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          :label="isCorrection ? 'Submit Correction' : 'Record Progress'"
          :icon="isCorrection ? 'i-lucide-pencil' : 'i-lucide-trending-up'"
          :color="isCorrection ? 'warning' : 'primary'"
          :loading="loading"
          :disabled="Object.values(errors).some(e => e)"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>