<script setup lang="ts">
/**
 * MpoEditRejectedModal.vue
 *
 * Modal untuk mengedit MPO yang statusnya Rejected.
 * Mendukung:
 * - Edit qty per part (total harus pas dengan original)
 * - Ganti supplier per part (atau per split)
 * - Split part ke beberapa supplier (sama persis dengan UI create form)
 * - Hasil submit: MPO asal diupdate, MPO baru dibuat untuk supplier yang berbeda
 *
 * Props: open, mpo (Mpo lengkap dengan details)
 * Emits: update:open, saved
 */
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useMpoStore } from '../../../../stores/material/mpo.store'
import type { Mpo } from '../../../../types/material/mpo'

const formRef = ref()
const store = useMpoStore()

const props = defineProps<{
  open: boolean
  mpo: Mpo | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const schema = z.object({
  po_date: z.string().min(1, 'PO Date is required')
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupplierOption {
  id: number
  name: string
}

interface ItemSplit {
  _key: number
  supplier_id: number | null
  qty: number
}

interface PartItem {
  part_id: number
  part_name: string
  part_number: string
  original_qty: number  // qty dari detail MPO — tidak boleh berubah total
  price: number
  notes: string | null
  uom_code: string
  available_suppliers: SupplierOption[]
  splits: ItemSplit[]
}

// ─── State ───────────────────────────────────────────────────────────────────

let _keyCounter = 0
function nextKey() { return ++_keyCounter }

const state = reactive({
  description: '',
  po_date: new Date().toISOString().split('T')[0],
  payment_term: '',
  remarks: '',
  save_as_draft: true,
  parts: [] as PartItem[]
})

const isLoadingSuppliers = ref(false)

// ─── Populate state dari MPO yang di-edit ────────────────────────────────────

watch(() => props.open, async (isOpen) => {
  if (!isOpen || !props.mpo) return

  const mpo = props.mpo

  // Header
  state.description = mpo.description || ''
  state.po_date = mpo.po_date || new Date().toISOString().split('T')[0]
  state.payment_term = mpo.payment_term || ''
  state.remarks = ''  // remarks baru (remarks lama adalah alasan reject)
  state.save_as_draft = true

  // Load parts dari details MPO asal
  isLoadingSuppliers.value = true
  try {
    const partIds = (mpo.details || []).map(d => d.part_id)

    // Fetch supplier yang tersedia per part dari backend
    const suppliersPerPart: Record<number, SupplierOption[]> = {}
    await Promise.all(
      partIds.map(async (partId) => {
        const list = await store.fetchDropdownSupplierForPart(partId)
        suppliersPerPart[partId] = list
      })
    )

    state.parts = (mpo.details || []).map(d => {
      const availableSuppliers = suppliersPerPart[d.part_id] || []

      // Default: supplier sekarang (dari header MPO)
      const currentSupplierId = mpo.supplier_id
      const currentSupplierExists = availableSuppliers.some(s => s.id === currentSupplierId)

      // Kalau supplier saat ini tidak ada di list (misal belum di-mapping), tambahkan secara manual
      // supaya baris awal tidak kosong
      const finalSuppliers: SupplierOption[] = currentSupplierExists
        ? availableSuppliers
        : [
            { id: currentSupplierId, name: (mpo as any).supplier?.name || `Supplier #${currentSupplierId}` },
            ...availableSuppliers
          ]

      return {
        part_id: d.part_id,
        part_name: d.part?.part_name ?? '-',
        part_number: d.part?.part_number ?? '-',
        original_qty: Number(d.qty),
        price: d.price ?? 0,
        notes: d.notes ?? null,
        uom_code: d.part?.uom?.code ?? '-',
        available_suppliers: finalSuppliers,
        splits: [{
          _key: nextKey(),
          supplier_id: currentSupplierId,
          qty: Number(d.qty)
        }]
      } as PartItem
    })
  } catch {
    state.parts = []
  } finally {
    isLoadingSuppliers.value = false
  }
})

// ─── Split helpers ────────────────────────────────────────────────────────────

function addSplit(part: PartItem) {
  const usedIds = new Set(part.splits.map(s => s.supplier_id))
  const nextSupplier = part.available_suppliers.find(s => !usedIds.has(s.id)) ?? null

  const newCount = part.splits.length + 1
  const baseQty = Math.floor(part.original_qty / newCount)
  const remainder = part.original_qty - baseQty * newCount

  part.splits.forEach((s, i) => {
    s.qty = baseQty + (i < remainder ? 1 : 0)
  })

  part.splits.push({
    _key: nextKey(),
    supplier_id: nextSupplier?.id ?? null,
    qty: baseQty
  })
}

function removeSplit(part: PartItem, key: number) {
  if (part.splits.length <= 1) return
  part.splits = part.splits.filter(s => s._key !== key)
  rebalance(part)
}

function rebalance(part: PartItem) {
  const n = part.splits.length
  const base = Math.floor(part.original_qty / n)
  const rem = part.original_qty - base * n
  part.splits.forEach((s, i) => {
    s.qty = base + (i < rem ? 1 : 0)
  })
}

function clampQty(part: PartItem, split: ItemSplit) {
  const val = Number(split.qty)
  const otherTotal = part.splits
    .filter(s => s._key !== split._key)
    .reduce((sum, s) => sum + (Number(s.qty) || 0), 0)
  const maxAllowed = part.original_qty - otherTotal
  split.qty = Math.min(Math.max(val || 1, 1), maxAllowed)
}

// ─── Validasi ─────────────────────────────────────────────────────────────────

function splitTotal(part: PartItem): number {
  return part.splits.reduce((sum, s) => sum + (Number(s.qty) || 0), 0)
}

function getSupplierId(val: any): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'object') return val.id ?? null
  return Number(val)
}

function isPartValid(part: PartItem): boolean {
  return (
    splitTotal(part) === Number(part.original_qty) &&
    part.splits.every(s => getSupplierId(s.supplier_id) !== null && Number(s.qty) > 0)
  )
}

const allValid = computed(() => state.parts.every(isPartValid))

function availableForSplit(part: PartItem, split: ItemSplit): SupplierOption[] {
  const usedIds = new Set(
    part.splits
      .filter(s => s._key !== split._key)
      .map(s => getSupplierId(s.supplier_id))
      .filter(id => id !== null)
  )
  return part.available_suppliers.filter(s => !usedIds.has(s.id))
}

// Preview: berapa MPO yang akan terbentuk
const dynamicMpoCount = computed(() => {
  if (!props.mpo) return 0
  const originalSupplierId = props.mpo.supplier_id
  const allSupplierIds = new Set<number>()
  state.parts.forEach(p =>
    p.splits.forEach(s => {
      const id = getSupplierId(s.supplier_id)
      if (id !== null) allSupplierIds.add(id)
    })
  )
  // MPO asal hitung 1 kalau ada minimal 1 baris dengan supplier original,
  // ditambah 1 per supplier berbeda
  let count = 0
  if (allSupplierIds.has(originalSupplierId)) count++
  allSupplierIds.forEach(id => { if (id !== originalSupplierId) count++ })
  return count
})

// ─── Submit ───────────────────────────────────────────────────────────────────

async function onSubmit(_event: FormSubmitEvent<any>) {
  if (!props.mpo) return

  const items = state.parts.flatMap(p =>
    p.splits.map(s => ({
      part_id: p.part_id,
      qty: Number(s.qty),
      price: p.price,
      notes: p.notes,
      supplier_id: getSupplierId(s.supplier_id)
    }))
  )

  try {
    await store.splitUpdateMpo(props.mpo.id, {
      po_date: state.po_date,
      payment_term: state.payment_term || undefined,
      description: state.description || undefined,
      remarks: state.remarks || undefined,
      action: state.save_as_draft ? 'draft' : 'submit',
      items
    })
    emit('saved')
    emit('update:open', false)
  } catch {
    // error sudah di-handle oleh store (di-expose via store.error)
  }
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.mpo?.status?.toLowerCase() === 'rejected' ? 'Edit & Resubmit MPO (Rejected)' : 'Edit MPO'"
    class="sm:max-w-3xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">

        <!-- Info banner — hanya tampil untuk MPO rejected -->
        <div
          v-if="props.mpo?.status?.toLowerCase() === 'rejected'"
          class="flex items-start gap-3 p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
        >
          <UIcon name="i-lucide-info" class="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
          <div class="text-sm text-warning-700 dark:text-warning-300">
            <p class="font-medium">This MPO was previously rejected.</p>
            <p class="text-xs mt-0.5">
              You can change the qty, switch supplier, or split it to a different supplier.
              The total qty for each part must remain the same as the original.
              If any part is moved to a different supplier, a new MPO will be created automatically.
            </p>
          </div>
        </div>

        <!-- Loading suppliers -->
        <div v-if="isLoadingSuppliers" class="text-sm text-muted animate-pulse">
          Loading supplier data...
        </div>

        <!-- Part list dengan split support -->
        <div v-else-if="state.parts.length > 0" class="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 rounded-xl space-y-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-git-branch" class="w-5 h-5 text-primary" />
            <h3 class="font-bold text-primary-700">
              Set Supplier per Part
              <span class="font-normal text-sm ml-1">(will create {{ dynamicMpoCount }} MPO)</span>
            </h3>
          </div>

          <div class="max-h-96 overflow-y-auto pr-1 space-y-3">
            <div
              v-for="part in state.parts"
              :key="part.part_id"
              class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-default"
              :class="!isPartValid(part) ? 'border-error-400' : ''"
            >
              <!-- Part header -->
              <div class="flex items-center justify-between px-3 py-2 border-b border-default">
                <div>
                  <p class="font-semibold text-sm">{{ part.part_name }}</p>
                  <p class="text-xs text-muted">
                    {{ part.part_number }} · Original qty: {{ part.original_qty }} {{ part.uom_code }}
                    <span
                      class="ml-2 font-medium"
                      :class="splitTotal(part) === part.original_qty ? 'text-success-600' : 'text-error-500'"
                    >
                      (split: {{ splitTotal(part) }} / {{ part.original_qty }})
                    </span>
                  </p>
                </div>
                <!-- Tombol split hanya muncul kalau ada supplier lain yang belum dipakai -->
                <UButton
                  v-if="part.splits.length < part.available_suppliers.length"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-git-branch"
                  label="Split"
                  @click="addSplit(part)"
                />
              </div>

              <!-- Split rows -->
              <div class="divide-y divide-default">
                <div
                  v-for="split in part.splits"
                  :key="split._key"
                  class="flex items-center gap-3 px-3 py-2"
                >
                  <!-- Supplier dropdown -->
                  <div class="flex-1">
                    <USelectMenu
                      v-model="split.supplier_id"
                      :items="availableForSplit(part, split)"
                      value-key="id"
                      label-key="name"
                      placeholder="Select supplier..."
                      class="w-full"
                      size="sm"
                    />
                  </div>

                  <!-- Qty input -->
                  <div class="w-28">
                    <UInput
                      v-model.number="split.qty"
                      type="number"
                      :min="1"
                      :max="part.original_qty"
                      size="sm"
                      class="w-full"
                      placeholder="Qty"
                      @change="clampQty(part, split)"
                      @blur="clampQty(part, split)"
                    />
                  </div>

                  <!-- Hapus split -->
                  <UButton
                    v-if="part.splits.length > 1"
                    size="xs"
                    color="error"
                    variant="ghost"
                    icon="i-lucide-x"
                    @click="removeSplit(part, split._key)"
                  />
                  <div v-else class="w-7 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          <p v-if="!allValid" class="text-xs text-error-500 flex items-center gap-1">
            <UIcon name="i-lucide-triangle-alert" class="w-3.5 h-3.5" />
            Make sure the total qty for each part is fully distributed and all suppliers are selected.
          </p>
        </div>

        <!-- Header fields -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="PO Date" name="po_date" required>
            <UInput v-model="state.po_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Payment Term" name="payment_term">
            <UInput v-model="state.payment_term" placeholder="e.g. Net 30" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UInput v-model="state.description" placeholder="Optional description..." class="w-full" />
        </UFormField>

        <UFormField label="Remarks" name="remarks">
          <UTextarea
            v-model="state.remarks"
            placeholder="Notes for this resubmission (optional)..."
            class="w-full"
            rows="2"
          />
        </UFormField>

        <div class="flex items-center gap-3 pt-1">
          <UCheckbox v-model="state.save_as_draft" />
          <div>
            <p class="text-sm font-medium">Save as Draft</p>
            <p class="text-xs text-muted">Uncheck to submit directly to the Supervisor.</p>
          </div>
        </div>

      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="emit('update:open', false)" />
        <UButton
          color="warning"
          :label="state.save_as_draft ? 'Save as Draft' : 'Save & Submit'"
          icon="i-lucide-save"
          :loading="store.loading"
          :disabled="state.parts.length === 0 || !allValid"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>