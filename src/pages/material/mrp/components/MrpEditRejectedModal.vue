<script setup lang="ts">
/**
 * MrpEditRejectedModal.vue
 *
 * Modal untuk mengedit MRP yang statusnya Rejected.
 * - Edit header: description, priority, notes
 * - Edit details: qty per part, tambah/hapus part
 * - Pilihan: Save as Draft atau langsung Submit
 *
 * Props: open, mrp (Mrp lengkap dengan details)
 * Emits: update:open, saved
 */
import { reactive, watch, ref, computed } from 'vue'
import { useMrpStore } from '../../../../stores/material/mrp.store'
import type { Mrp } from '../../../../types/material/mrp'
import { useAppToast } from '../../../../composables/useAppToast'

const store = useMrpStore()
const { toastError } = useAppToast()

const props = defineProps<{
  open: boolean
  mrp: Mrp | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

// ─── State ────────────────────────────────────────────────────────────────────

const state = reactive({
  description: '',
  priority: '' as string | null,
  notes: '',
  save_as_draft: true
})

const editableDetails = ref<{
  part_id: number
  qty: number
  bom_id?: number
  notes?: string
  part_number?: string
  part_name?: string
  uom_code?: string
}[]>([])

const selectedNewParts = ref<number[]>([])

// ─── Populate state ketika modal dibuka ──────────────────────────────────────

watch(() => props.open, async (isOpen) => {
  if (!isOpen || !props.mrp) return

  const mrp = props.mrp

  state.description = mrp.description || ''
  state.priority = mrp.priority || null
  state.notes = mrp.notes || ''
  state.save_as_draft = true

  editableDetails.value = (mrp.details || []).map(d => ({
    part_id: d.part_id,
    qty: d.qty,
    bom_id: d.bom_id ?? undefined,
    notes: d.notes ?? undefined,
    part_number: d.part?.part_number,
    part_name: d.part?.part_name,
    uom_code: d.part?.uom?.code
  }))

  selectedNewParts.value = []

  // Pastikan dropdown parts tersedia
  if (!store.partsDropdown.length) {
    await store.fetchDropdownParts()
  }
})

// ─── Parts dropdown ───────────────────────────────────────────────────────────

const availableParts = computed(() => {
  const existingIds = editableDetails.value.map(d => d.part_id)
  return store.partsDropdown.filter(p => !existingIds.includes(p.id))
})

const partItems = computed(() => availableParts.value.map(p => p.part_name))

const selectedPartLabels = computed({
  get: () => selectedNewParts.value
    .map(id => store.partsDropdown.find(p => p.id === id)?.part_name)
    .filter(Boolean) as string[],
  set: (vals: string[]) => {
    selectedNewParts.value = vals
      .map(name => store.partsDropdown.find(p => p.part_name === name)?.id)
      .filter(Boolean) as number[]
  }
})

function addNewPart() {
  if (!selectedNewParts.value.length) return
  selectedNewParts.value.forEach(partId => {
    const part = store.partsDropdown.find(p => p.id === partId)
    if (!part || editableDetails.value.find(d => d.part_id === partId)) return
    editableDetails.value.push({
      part_id: part.id,
      qty: 0,
      part_number: part.part_number,
      part_name: part.part_name,
      uom_code: part.uom?.code
    })
  })
  selectedNewParts.value = []
}

function removePart(partId: number) {
  editableDetails.value = editableDetails.value.filter(d => d.part_id !== partId)
}

// ─── Priority dropdown ────────────────────────────────────────────────────────

const priorityItems = computed(() => store.priorityDropdown)

// ─── Validasi ─────────────────────────────────────────────────────────────────

const hasZeroQty = computed(() => editableDetails.value.some(d => d.qty <= 0))
const canSubmit = computed(() => editableDetails.value.length > 0 && !hasZeroQty.value)

// ─── Submit ───────────────────────────────────────────────────────────────────

async function onSave() {
  if (!props.mrp) return

  try {
    // 1. Update header
    await store.updateMrp(props.mrp.id, {
      description: state.description || undefined,
      priority: state.priority || undefined,
      notes: state.notes || undefined,
      save_as_draft: true  // selalu simpan dulu sebagai draft
    })

    // 2. Update details
    await store.updateMrpDetail(props.mrp.id, {
      details: editableDetails.value.map(d => ({
        part_id: d.part_id,
        qty: d.qty,
        bom_id: d.bom_id,
        notes: d.notes
      }))
    })

    // 3. Kalau user memilih langsung submit, submit sekarang
    if (!state.save_as_draft) {
      await store.submitMrp(props.mrp.id)
    }

    emit('saved')
    emit('update:open', false)
  } catch (e: any) {
    toastError(e)
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Edit & Resubmit MRP (Rejected)"
    class="sm:max-w-3xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-5">
        <!-- Info banner -->
        <div class="flex items-start gap-3 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
          <UIcon name="i-lucide-info" class="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
          <div class="text-sm text-warning-700 dark:text-warning-300">
            <p class="font-medium">This MRP was previously rejected.</p>
            <p class="text-xs mt-0.5">
              Rejected notes: <span class="italic">"{{ props.mrp?.rejected_notes || '-' }}"</span>
            </p>
            <p class="text-xs mt-1">
              Fix the data below, then choose Save as Draft or submit directly to the Supervisor.
            </p>
          </div>
        </div>

        <!-- Header fields -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Priority" name="priority">
            <USelectMenu
              v-model="state.priority"
              :items="priorityItems"
              placeholder="Select priority..."
              class="w-full"
              clear
            />
          </UFormField>
          <UFormField label="Description" name="description">
            <UInput v-model="state.description" placeholder="Optional description..." class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Notes" name="notes">
          <UTextarea
            v-model="state.notes"
            placeholder="Additional notes (optional)..."
            class="w-full"
            rows="2"
          />
        </UFormField>

        <!-- Add Material -->
        <div class="flex items-end gap-2 bg-elevated/30 p-4 rounded-xl border border-default">
          <UFormField label="Add Material" class="flex-1 max-w-sm">
            <USelectMenu
              v-model="selectedPartLabels"
              :items="partItems"
              placeholder="Search and select parts..."
              class="w-full"
              clear
              searchable
              multiple
            />
          </UFormField>
          <UButton
            label="Add"
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            :disabled="selectedNewParts.length === 0"
            @click="addNewPart"
          />
        </div>

        <!-- Material Table -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default min-w-[220px]">Part</th>
                <th class="p-3 font-medium border-r border-default w-40 text-center">Qty Needed</th>
                <th class="p-3 font-medium border-r border-default w-24 text-center">UOM</th>
                <th class="p-3 font-medium border-r border-default">Notes</th>
                <th class="p-3 font-medium w-14 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="editableDetails.length === 0">
                <td colspan="5" class="p-8 text-center text-muted text-sm">
                  No materials. Add at least one part before submitting.
                </td>
              </tr>
              <tr
                v-for="item in editableDetails"
                :key="item.part_id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20"
              >
                <td class="p-3 border-r border-default">
                  <div class="font-medium">{{ item.part_number }}</div>
                  <div class="text-xs text-muted line-clamp-1">{{ item.part_name }}</div>
                </td>
                <td
                  class="p-2 border-r border-default text-center"
                  :class="{ 'bg-error-300 dark:bg-error-900/70': item.qty === 0 }"
                >
                  <UInput
                    v-model.number="item.qty"
                    type="number"
                    size="sm"
                    placeholder="Qty"
                    min="0"
                    class="max-w-[120px] mx-auto"
                  />
                </td>
                <td class="p-2 border-r border-default text-center">
                  <UBadge color="neutral" variant="subtle" size="xs">
                    {{ item.uom_code || '-' }}
                  </UBadge>
                </td>
                <td class="p-2 border-r border-default">
                  <UInput
                    v-model="item.notes"
                    size="sm"
                    placeholder="Notes..."
                    class="w-full"
                  />
                </td>
                <td class="p-3 text-center">
                  <UButton
                    icon="i-lucide-trash"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="removePart(item.part_id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="hasZeroQty" class="text-xs text-error-500 flex items-center gap-1">
          <UIcon name="i-lucide-triangle-alert" class="w-3.5 h-3.5" />
          All parts must have a qty greater than 0 before this can be saved.
        </p>

        <!-- Save as draft toggle -->
        <div class="flex items-center gap-3 pt-1">
          <UCheckbox v-model="state.save_as_draft" />
          <div>
            <p class="text-sm font-medium">Save as Draft</p>
            <p class="text-xs text-muted">Uncheck untuk langsung submit ke Supervisor.</p>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="emit('update:open', false)" />
        <UButton
          color="warning"
          :label="state.save_as_draft ? 'Save as Draft' : 'Save & Submit'"
          icon="i-lucide-save"
          :loading="store.loading"
          :disabled="!canSubmit"
          @click="onSave"
        />
      </div>
    </template>
  </UModal>
</template>