<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useAuthStore }    from '../../../../stores/auth.store'
import type { WorkOrderProgress, AddProgressPayload } from '../../../../types/production-plan/work-order'

const props = defineProps<{
  open:     boolean
  progress: WorkOrderProgress | null
  loading:  boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'submit':      [payload: AddProgressPayload]
}>()

const authStore = useAuthStore()

const form = reactive({ qty_good: 0, qty_reject: 0, qty_scrap: 0 })
const errors = reactive({ qty_good: '', qty_reject: '', qty_scrap: '' })

watch(() => props.open, (v) => {
  if (v && props.progress) {
    // Pre-fill dari nilai progress terakhir agar user tahu nilai saat ini
    form.qty_good   = props.progress.qty_good   ?? 0
    form.qty_reject = props.progress.qty_reject ?? 0
    form.qty_scrap  = props.progress.qty_scrap  ?? 0
    errors.qty_good   = ''
    errors.qty_reject = ''
    errors.qty_scrap  = ''
  }
})

function validate(): boolean {
  errors.qty_good   = ''
  errors.qty_reject = ''
  errors.qty_scrap  = ''
  let valid = true

  if (form.qty_good < 0)   { errors.qty_good   = 'Cannot be negative.'; valid = false }
  if (form.qty_reject < 0) { errors.qty_reject = 'Cannot be negative.'; valid = false }
  if (form.qty_scrap < 0)  { errors.qty_scrap  = 'Cannot be negative.'; valid = false }

  if (form.qty_good === 0 && form.qty_reject === 0 && form.qty_scrap === 0) {
    errors.qty_good = 'At least one field must be greater than 0.'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validate()) return
  const userId = authStore.user?.id
  if (!userId) return

  emit('submit', {
    qty_good:    form.qty_good,
    qty_reject:  form.qty_reject || undefined,
    qty_scrap:   form.qty_scrap  || undefined,
    reported_by: userId,
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Edit Last Progress"
    description="Replace the last progress record with corrected values."
    :ui="{ content: 'sm:max-w-sm' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-pencil"
          description="This will delete the last progress record and replace it with the values below."
        />

        <UFormField label="Qty Good" :error="errors.qty_good" required>
          <UInput v-model.number="form.qty_good" type="number" min="0" class="w-full font-mono" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Qty Reject" :error="errors.qty_reject">
            <UInput v-model.number="form.qty_reject" type="number" min="0" class="w-full font-mono" />
          </UFormField>
          <UFormField label="Qty Scrap" :error="errors.qty_scrap">
            <UInput v-model.number="form.qty_scrap" type="number" min="0" class="w-full font-mono" />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="emit('update:open', false)" />
        <UButton
          label="Save Changes"
          icon="i-lucide-check"
          color="warning"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>