<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useMprStore } from '../../../../stores/material/mpr.store'
import type { Mpr } from '../../../../types/material/mpr'

const formRef = ref()
const store = useMprStore()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  mpr: Partial<Mpr>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Record<string, any>]
}>()

const schema = z.object({
  description: z.string().min(1, 'Description is required'),
  request_date: z.string().min(1, 'Request date is required')
})

type Schema = z.output<typeof schema>

const state = reactive<{
  description: string
  request_date: string
  remarks: string
  details: { part_id: number | undefined; qty: number; required_date: string; notes: string }[]
}>({
  description: '',
  request_date: '',
  remarks: '',
  details: []
})

// Sync props → state on edit open
watch(
  () => props.mpr,
  (val) => {
    state.description = val.description ?? ''
    state.request_date = val.request_date ?? ''
    state.remarks = val.remarks ?? ''
    if (val.details && val.details.length) {
      state.details = val.details.map(d => ({
        part_id: d.part_id,
        qty: d.qty,
        required_date: d.required_date ?? '',
        notes: d.notes ?? ''
      }))
    } else {
      state.details = [{ part_id: undefined, qty: 0, required_date: '', notes: '' }]
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.description = ''
      state.request_date = ''
      state.remarks = ''
      state.details = [{ part_id: undefined, qty: 0, required_date: '', notes: '' }]
    }
  }
)

const isAutoType = computed(() => props.mode === 'edit' && props.mpr?.type === 'auto')

// ─── Date model helper ───────────────────────────────────────────────────────
function makeDateModel(
  getter: () => string,
  setter: (v: string) => void
) {
  return computed({
    get() {
      const val = getter()
      if (!val) return null
      const [y, m, d] = val.split('-').map(Number)
      return new CalendarDate(y, m, d)
    },
    set(val: CalendarDate | null) {
      if (!val) { setter(''); return }
      setter(`${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`)
    }
  })
}

const requestDateModel = makeDateModel(
  () => state.request_date,
  (v) => { state.request_date = v }
)

// ─── Parts dropdown ─────────────────────────────────────────────────────────
function getFilteredPartItems(index: number) {
  const selectedOtherPartIds = state.details
    .filter((d, idx) => idx !== index && d.part_id !== undefined)
    .map(d => d.part_id)
  return store.partsDropdown
    .filter(p => !selectedOtherPartIds.includes(p.value))
    .map(p => ({ value: p.value, label: p.label }))
}

const canAddRow = computed(() => {
  return state.details.length < store.partsDropdown.length
})

function getPartLabel(partId: number | undefined) {
  if (!partId) return undefined
  return store.partsDropdown.find(p => p.value === partId)?.label
}

function setPartId(index: number, label: string | undefined) {
  state.details[index].part_id = store.partsDropdown.find(p => p.label === label)?.value
}

function addDetailRow() {
  if (canAddRow.value) {
    state.details.push({ part_id: undefined, qty: 0, required_date: '', notes: '' })
  }
}

function removeDetailRow(index: number) {
  if (state.details.length > 1) {
    state.details.splice(index, 1)
  }
}

// ─── Submit ──────────────────────────────────────────────────────────────────
function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<Schema>) {
  const validDetails = state.details.filter(d => d.part_id && d.qty > 0)
  emit('save', {
    description: event.data.description,
    request_date: event.data.request_date,
    remarks: state.remarks || undefined,
    details: validDetails
  })
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.mode === 'add' ? 'Create MPR' : 'Edit MPR'"
    :description="props.mode === 'add'
      ? 'Create a new Material Purchase Request manually.'
      : 'Update MPR header and part details.'"
    class="sm:max-w-2xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Description -->
          <UFormField
            label="Description"
            name="description"
            required
            class="md:col-span-2"
          >
            <UInput
              v-model="state.description"
              placeholder="e.g. Request for May Production Material"
              class="w-full"
              :disabled="isAutoType"
            />
          </UFormField>

          <!-- Request Date -->
          <UFormField label="Request Date" name="request_date" required>
            <UInputDate v-model="requestDateModel" :disabled="isAutoType">
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="px-0"
                    :disabled="isAutoType"
                  />
                  <template #content>
                    <UCalendar v-model="requestDateModel" class="p-2" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>

          <!-- Remarks -->
          <UFormField label="Remarks" name="remarks">
            <UInput
              v-model="state.remarks"
              placeholder="Optional remarks..."
              class="w-full"
              :disabled="isAutoType"
            />
          </UFormField>
        </div>

        <!-- Part Details -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Parts & Quantities</label>
            <UButton
              label="Add Row"
              icon="i-lucide-plus"
              size="xs"
              color="neutral"
              variant="outline"
              :disabled="!canAddRow || isAutoType"
              @click="addDetailRow"
            />
          </div>

          <div class="border border-default rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-elevated/50">
                <tr>
                  <th class="p-2.5 text-left font-medium border-b border-default">
                    Part
                  </th>
                  <th class="p-2.5 text-center font-medium border-b border-default w-24">
                    Qty
                  </th>
                  <th class="p-2.5 text-left font-medium border-b border-default w-36">
                    Required Date
                  </th>
                  <th class="p-2.5 text-left font-medium border-b border-default">
                    Notes
                  </th>
                  <th class="p-2.5 text-center font-medium border-b border-default w-12" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in state.details"
                  :key="idx"
                  class="border-b border-default last:border-b-0"
                >
                  <td class="p-2">
                    <USelectMenu
                      :model-value="getPartLabel(row.part_id)"
                      :items="getFilteredPartItems(idx).map(p => p.label)"
                      placeholder="Select part..."
                      searchable
                      clear
                      class="w-full"
                      :disabled="isAutoType"
                      @update:model-value="(val: string | undefined) => setPartId(idx, val)"
                    />
                  </td>
                  <td class="p-2">
                    <UInput
                      v-model.number="row.qty"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full"
                      :disabled="isAutoType"
                    />
                  </td>
                  <td class="p-2">
                    <UInput
                      v-model="row.required_date"
                      type="date"
                      class="w-full"
                      :disabled="isAutoType"
                    />
                  </td>
                  <td class="p-2">
                    <UInput
                      v-model="row.notes"
                      placeholder="Notes..."
                      class="w-full"
                      :disabled="isAutoType"
                    />
                  </td>
                  <td class="p-2 text-center">
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :disabled="state.details.length <= 1 || isAutoType"
                      @click="removeDetailRow(idx)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-muted">
            Rows with no part selected or qty = 0 will be ignored.
          </p>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click="close"
        />
        <UButton
          color="primary"
          label="Save"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>