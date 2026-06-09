<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSprStore } from '../../../../stores/sales/spr.store'
import type { Spr } from '../../../../types/sales/spr'

const formRef = ref()
const store = useSprStore()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  spr: Partial<Spr>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: Record<string, any>]
}>()

const schema = z.object({
  spr_name: z.string().min(1, 'SPR Name is required'),
  required_date: z.string().min(1, 'Required date is required'),
  description: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<{
  spr_name: string
  required_date: string
  description: string
  details: { part_id: number | undefined; qty: number }[]
}>({
  spr_name: '',
  required_date: '',
  description: '',
  details: []
})

// Sync props → state on edit open
watch(
  () => props.spr,
  (val) => {
    state.spr_name = val.spr_name ?? ''
    state.required_date = val.required_date ?? ''
    state.description = val.description ?? ''
    // Populate details from existing spr details for edit
    if (val.details && val.details.length) {
      state.details = val.details.map(d => ({ part_id: d.part_id, qty: d.qty }))
    } else {
      state.details = [{ part_id: undefined, qty: 0 }]
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      state.spr_name = ''
      state.required_date = ''
      state.description = ''
      state.details = [{ part_id: undefined, qty: 0 }]
    }
  }
)

const isAutomatic = computed(() => props.mode === 'edit' && props.spr?.source === 'Automatic')

const dateModel = computed({
  get() {
    if (!state.required_date) return null
    const [y, m, d] = state.required_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) {
      state.required_date = ''
      return
    }
    const yyyy = val.year
    const mm = String(val.month).padStart(2, '0')
    const dd = String(val.day).padStart(2, '0')
    state.required_date = `${yyyy}-${mm}-${dd}`
  }
})

// ─── Parts dropdown ─────────────────────────────────────────────────────────
function getFilteredPartItems(index: number) {
  const selectedOtherPartIds = state.details
    .filter((d, idx) => idx !== index && d.part_id !== undefined)
    .map(d => d.part_id)
  return store.partsDropdown
    .filter(p => !selectedOtherPartIds.includes(p.id))
    .map(p => p.part_name)
}

const canAddRow = computed(() => {
  return state.details.length < store.partsDropdown.length
})

function getPartLabel(partId: number | undefined) {
  if (!partId) return undefined
  return store.partsDropdown.find(p => p.id === partId)?.part_name
}

function setPartId(index: number, label: string | undefined) {
  state.details[index].part_id = store.partsDropdown.find(p => p.part_name === label)?.id
}

function addDetailRow() {
  if (canAddRow.value) {
    state.details.push({ part_id: undefined, qty: 0 })
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

  // Validate min_qty_sell
  const toast = useToast()
  for (const d of validDetails) {
    const part = store.partsDropdown.find(p => p.id === d.part_id)
    const minQty = part?.min_qty_sell !== undefined ? part.min_qty_sell : 10
    if (d.qty < minQty) {
      toast.add({
        title: 'Validation Error',
        description: `Quantity for part ${part?.part_number} (${d.qty}) is less than the minimum sales quantity of ${minQty}.`,
        color: 'error'
      })
      return
    }
  }

  emit('save', {
    spr_name: event.data.spr_name,
    required_date: event.data.required_date,
    description: event.data.description,
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
    :title="props.mode === 'add' ? 'Create SPR' : 'Edit SPR'"
    :description="props.mode === 'add'
      ? 'Create a new Sales Purchase Request manually.'
      : 'Update SPR header and part details.'"
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
          <!-- SPR Name -->
          <UFormField label="SPR Name" name="spr_name" required>
            <UInput v-model="state.spr_name" placeholder="e.g. Request for May Production Demand" class="w-full" />
          </UFormField>

          <!-- Required Date -->
          <UFormField label="Required Date" name="required_date" required>
            <UInputDate v-model="dateModel" :disabled="isAutomatic">
              <template #trailing>
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    class="px-0"
                    :disabled="isAutomatic"
                  />
                  <template #content>
                    <UCalendar
                      v-model="dateModel"
                      class="p-2"
                    />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
        </div>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            placeholder="Additional notes..."
            class="w-full"
            :rows="2"
            :disabled="isAutomatic"
          />
        </UFormField>

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
              :disabled="!canAddRow"
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
                  <th class="p-2.5 text-center font-medium border-b border-default w-32">
                    Qty
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
                      :items="getFilteredPartItems(idx)"
                      placeholder="Select part..."
                      searchable
                      clear
                      class="w-full"
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
                    />
                  </td>
                  <td class="p-2 text-center">
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :disabled="state.details.length <= 1"
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
