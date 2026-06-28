<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useMpoStore } from '../../../../stores/material/mpo.store'
import type { Mpo, MpoSourceData } from '../../../../types/material/mpo'

const formRef = ref()
const store = useMpoStore()

const props = defineProps<{ open: boolean, mode: 'add' | 'edit', mpo: Partial<Mpo>, loading: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean], save: [data: any] }>()

const schema = z.object({
  po_date: z.string().min(1, 'PO Date is required')
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupplierOption {
  id: number
  name: string
}

interface ItemSplit {
  _key: number          // unik per baris, bukan part_id (karena bisa duplikat)
  supplier_id: number | null
  qty: number
}

interface PartItem {
  part_id: number
  part_name: string
  original_qty: number  // qty dari source dokumen, tidak boleh diubah
  price: number
  notes: string | null
  available_suppliers: SupplierOption[]
  splits: ItemSplit[]   // 1 atau lebih baris supplier+qty
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

const selectedSource = ref<any>(null)
const loadedSourceData = ref<MpoSourceData | null>(null)
const isLoadingSource = ref(false)

const sourceItems = computed(() => store.sourceDropdown)
const selectedSourceLabel = computed({
  get: () => selectedSource.value?.label ?? '',
  set: (val: string) => {
    selectedSource.value = sourceItems.value.find(s => s.label === val) ?? null
  }
})

// ─── Reset ───────────────────────────────────────────────────────────────────

watch(() => props.open, (isOpen) => {
  if (isOpen && props.mode === 'add') {
    selectedSource.value = null
    loadedSourceData.value = null
    state.description = ''
    state.po_date = new Date().toISOString().split('T')[0]
    state.payment_term = ''
    state.remarks = ''
    state.save_as_draft = true
    state.parts = []
    store.fetchDropdownSource()
  }
})

// ─── Load source data → build parts ──────────────────────────────────────────

watch(selectedSource, async (val) => {
  if (!val) {
    loadedSourceData.value = null
    state.parts = []
    return
  }
  isLoadingSource.value = true
  try {
    loadedSourceData.value = await store.loadSourceData(val.source_type, val.source_id)

    if (loadedSourceData.value?.details) {
      state.parts = (loadedSourceData.value.details as any[])
        .map(d => {
          const suppliers: SupplierOption[] = (d.part?.suppliers ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            is_primary: s.SPartSuppliers?.is_primary ?? false
          }))

          const primarySupplier = (suppliers as any[]).find(s => s.is_primary) ?? suppliers[0] ?? null

          return {
            part_id: d.part_id,
            part_name: d.part?.part_name ?? '-',
            original_qty: Number(d.qty),
            price: d.part?.price || 0,
            notes: d.notes ?? null,
            available_suppliers: suppliers,
            splits: [{
              _key: nextKey(),
              supplier_id: primarySupplier?.id ?? null,
              qty: d.qty  // default: semua qty ke primary supplier
            }]
          } as PartItem
        })
        .filter(p => p.available_suppliers.length > 0)
    }
  } catch {
    loadedSourceData.value = null
    state.parts = []
  } finally {
    isLoadingSource.value = false
  }
})

// ─── Split helpers ────────────────────────────────────────────────────────────

function addSplit(part: PartItem) {
  // Ambil supplier yang belum dipakai di splits lain, kalau ada
  const usedIds = new Set(part.splits.map(s => s.supplier_id))
  const nextSupplier = part.available_suppliers.find(s => !usedIds.has(s.id)) ?? null

  // Distribusi ulang qty secara rata ke semua split (termasuk yang baru)
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
  if (part.splits.length <= 1) return // minimal 1 baris
  part.splits = part.splits.filter(s => s._key !== key)

  // Rebalance qty setelah hapus
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
  // Minimal 1, maksimal sisa qty yang tersedia untuk split ini
  const otherTotal = part.splits
    .filter(s => s._key !== split._key)
    .reduce((sum, s) => sum + (Number(s.qty) || 0), 0)
  const maxAllowed = part.original_qty - otherTotal
  split.qty = Math.min(Math.max(val || 1, 1), maxAllowed)
}

// ─── Validasi per part ────────────────────────────────────────────────────────

function splitTotal(part: PartItem): number {
  return part.splits.reduce((sum, s) => sum + (Number(s.qty) || 0), 0)
}

function getSupplierId(val: any): number | null {
  // USelectMenu v3 dengan value-key bisa return object atau primitive tergantung versi
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

// Supplier yang tersedia untuk satu split = semua supplier MINUS yang sudah dipakai di split lain
function availableForSplit(part: PartItem, split: ItemSplit): SupplierOption[] {
  const usedIds = new Set(
    part.splits
      .filter(s => s._key !== split._key)
      .map(s => getSupplierId(s.supplier_id))
      .filter(id => id !== null)
  )
  return part.available_suppliers.filter(s => !usedIds.has(s.id))
}

// ─── Preview MPO count ────────────────────────────────────────────────────────

const dynamicMpoCount = computed(() => {
  const ids = new Set<number>()
  state.parts.forEach(p => p.splits.forEach(s => { if (s.supplier_id) ids.add(s.supplier_id) }))
  return ids.size
})

// ─── Submit ───────────────────────────────────────────────────────────────────

function onSubmit(_event: FormSubmitEvent<any>) {
  if (props.mode === 'add') {
    // Flatten semua splits ke flat items array yang backend sudah handle
    const items = state.parts.flatMap(p =>
      p.splits.map(s => ({
        part_id: p.part_id,
        qty: Number(s.qty),
        price: p.price,
        notes: p.notes,
        supplier_id: getSupplierId(s.supplier_id)
      }))
    )

    emit('save', {
      isAutoGenerate: true,
      source_type: selectedSource.value?.source_type,
      source_id: selectedSource.value?.source_id,
      description: state.description || undefined,
      po_date: state.po_date,
      payment_term: state.payment_term || undefined,
      remarks: state.remarks || undefined,
      action: state.save_as_draft ? 'draft' : 'submit',
      items
    })
  }
}
</script>

<template>
  <UModal :open="props.open" :title="'Auto-Generate MPO'" class="sm:max-w-3xl" @update:open="emit('update:open', $event)">
    <template #body>
      <UForm ref="formRef" :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">

        <template v-if="mode === 'add'">
          <UFormField label="Source Document (MRP / MPR)" name="source">
            <USelectMenu v-model="selectedSourceLabel" :items="sourceItems.map(s => s.label)" class="w-full" placeholder="Select source document..." searchable clear />
          </UFormField>

          <div v-if="isLoadingSource" class="text-sm text-muted animate-pulse">Loading data...</div>

          <div v-if="state.parts.length > 0" class="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 rounded-xl space-y-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-zap" class="w-5 h-5 text-primary" />
              <h3 class="font-bold text-primary-700">
                Determine Supplier (Automatically split into {{ dynamicMpoCount }} MPO)
              </h3>
            </div>

            <div class="max-h-96 overflow-y-auto pr-1 space-y-3">
              <!-- ── Per Part ── -->
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
                      Total: {{ part.original_qty }} pcs
                      <span
                        class="ml-2 font-medium"
                        :class="splitTotal(part) === part.original_qty ? 'text-success-600' : 'text-error-500'"
                      >
                        (split: {{ splitTotal(part) }} / {{ part.original_qty }})
                      </span>
                    </p>
                  </div>
                  <!-- Tombol split hanya muncul kalau masih ada supplier lain yang belum dipakai -->
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

                    <!-- Hapus split (hanya kalau lebih dari 1 baris) -->
                    <UButton
                      v-if="part.splits.length > 1"
                      size="xs"
                      color="error"
                      variant="ghost"
                      icon="i-lucide-x"
                      @click="removeSplit(part, split._key)"
                    />
                    <!-- Spacer supaya layout tidak geser saat tombol hapus tidak muncul -->
                    <div v-else class="w-7 shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Warning kalau ada part yang belum valid -->
            <p v-if="!allValid" class="text-xs text-error-500 flex items-center gap-1">
              <UIcon name="i-lucide-triangle-alert" class="w-3.5 h-3.5" />
              Make sure the total qty for each part is fully distributed and all suppliers are selected.
            </p>
          </div>

          <div v-else-if="loadedSourceData && state.parts.length === 0" class="p-4 text-center text-error border border-error-200 rounded-xl bg-error-50">
            All materials from this document have already been purchased.
          </div>
        </template>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="PO Date" name="po_date" required><UInput v-model="state.po_date" type="date" class="w-full" /></UFormField>
          <UFormField label="Payment Term" name="payment_term"><UInput v-model="state.payment_term" placeholder="e.g. Net 30" class="w-full" /></UFormField>
        </div>

        <UFormField label="Description" name="description"><UInput v-model="state.description" placeholder="Optional description..." class="w-full" /></UFormField>
        <UFormField label="Remarks" name="remarks"><UTextarea v-model="state.remarks" placeholder="Optional remarks..." class="w-full" rows="2" /></UFormField>

        <div class="flex items-center gap-3 pt-1">
          <UCheckbox v-model="state.save_as_draft" />
          <div><p class="text-sm font-medium">Save as Draft</p><p class="text-xs text-muted">Uncheck to submit directly to Supervisor.</p></div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-2 justify-end w-full">
        <UButton color="neutral" variant="ghost" label="Cancel" @click="emit('update:open', false)" />
        <UButton
          color="primary"
          :label="state.save_as_draft ? 'Generate Drafts' : 'Generate & Submit'"
          icon="i-lucide-zap"
          :loading="props.loading"
          :disabled="mode === 'add' && (state.parts.length === 0 || !allValid)"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </UModal>
</template>