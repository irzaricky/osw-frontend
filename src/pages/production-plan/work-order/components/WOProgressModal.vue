<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useAuthStore } from '../../../../stores/auth.store'
import type { AddProgressPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:              boolean
  plannedQty:        number
  currentCumulative: number
  loading:           boolean
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
})

const errors = reactive({
  qty_good:   '',
  qty_reject: '',
  qty_scrap:  '',
})

watch(() => props.open, (v) => {
  if (v) {
    form.qty_good   = 0
    form.qty_reject = 0
    form.qty_scrap  = 0
    errors.qty_good   = ''
    errors.qty_reject = ''
    errors.qty_scrap  = ''
  }
})

const newCumulative = computed(() => props.currentCumulative + form.qty_good)
const maxAllowed    = computed(() => Math.ceil(props.plannedQty * 1.1))

const progressPct = computed(() => {
  if (!props.plannedQty) return 0
  return Math.min(110, Math.round((newCumulative.value / props.plannedQty) * 100))
})

const currentPct = computed(() => {
  if (!props.plannedQty) return 0
  return Math.min(100, Math.round((props.currentCumulative / props.plannedQty) * 100))
})

const progressBarColor = computed(() => {
  if (progressPct.value >= 100) return 'bg-success-500'
  if (progressPct.value >= 60)  return 'bg-primary-500'
  if (progressPct.value >= 30)  return 'bg-warning-500'
  return 'bg-error-400'
})

function validate(): boolean {
  let valid = true
  errors.qty_good   = ''
  errors.qty_reject = ''
  errors.qty_scrap  = ''

  if (form.qty_good < 0)   { errors.qty_good = 'Cannot be negative.'; valid = false }
  if (form.qty_reject < 0) { errors.qty_reject = 'Cannot be negative.'; valid = false }
  if (form.qty_scrap < 0)  { errors.qty_scrap = 'Cannot be negative.'; valid = false }
  if (form.qty_good === 0 && form.qty_reject === 0 && form.qty_scrap === 0) {
    errors.qty_good = 'At least one quantity field must be greater than 0.'
    valid = false
  }
  if (newCumulative.value > maxAllowed.value) {
    errors.qty_good = `This would bring cumulative good qty to ${newCumulative.value}, exceeding 110% of planned (max: ${maxAllowed.value}). Use Complete Station instead.`
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
  const payload: AddProgressPayload = {
    qty_good:    form.qty_good,
    qty_reject:  form.qty_reject || undefined,
    qty_scrap:   form.qty_scrap  || undefined,
    reported_by: userId,
  }
  emit('submit', payload)
}
</script>

<template>
  <UModal
    :open="open"
    title="Report Progress"
    description="Record production output for this station."
    :ui="{ content: 'sm:max-w-md' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Current status bar -->
        <div class="p-3 bg-elevated rounded-lg space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Cumulative Good Qty</span>
            <span class="font-mono font-semibold">
              {{ currentCumulative.toLocaleString() }} / {{ plannedQty.toLocaleString() }}
            </span>
          </div>
          <div class="w-full h-1.5 bg-default rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="progressBarColor"
              :style="{ width: `${currentPct}%` }"
            />
          </div>
        </div>

        <!-- Qty Good -->
        <UFormField label="Qty Good (OK Units)" :error="errors.qty_good" required>
          <UInput
            v-model.number="form.qty_good"
            type="number"
            min="0"
            placeholder="0"
            class="w-full font-mono"
          />
          <template #hint>
            <span class="text-xs text-muted">
              New cumulative:
              <span
                class="font-semibold"
                :class="newCumulative > plannedQty ? 'text-warning-600' : 'text-default'"
              >
                {{ newCumulative.toLocaleString() }}
              </span>
              ({{ progressPct }}% of planned)
            </span>
          </template>
        </UFormField>

        <!-- Qty Reject + Scrap -->
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Qty Reject (NG)" :error="errors.qty_reject">
            <UInput v-model.number="form.qty_reject" type="number" min="0" placeholder="0" class="w-full font-mono" />
          </UFormField>
          <UFormField label="Qty Scrap" :error="errors.qty_scrap">
            <UInput v-model.number="form.qty_scrap" type="number" min="0" placeholder="0" class="w-full font-mono" />
          </UFormField>
        </div>

        <!-- Preview progress bar -->
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs text-muted">
            <span>After this report</span>
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
          label="Record Progress"
          icon="i-lucide-trending-up"
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>