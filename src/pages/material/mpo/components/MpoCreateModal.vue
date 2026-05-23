<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useMpoStore } from '../../../../stores/material/mpo.store'
import type { Mpo, MpoSourceData } from '../../../../types/material/mpo'

const formRef = ref()
const store = useMpoStore()

const props = defineProps<{
  open: boolean
  mode: 'add' | 'edit'
  mpo: Partial<Mpo>
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: any]
}>()

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  description: z.string().optional(),
  po_date: z.string().min(1, 'PO Date is required'),
  payment_term: z.string().optional(),
  remarks: z.string().optional()
})

// ─── Types ────────────────────────────────────────────────────────────────────
interface SourceItem {
  label: string
  source_type: 'mrp' | 'mpr'
  source_id: number
}

// Satu item yang sudah masuk ke keranjang MPO
interface CartItem {
  part_id: number
  part_number: string
  part_name: string
  uom_code: string
  qty: number
  price: number
  notes?: string
  // Supplier default dari part — otomatis terisi, tidak perlu user pilih manual
  supplier_id: number | undefined
  supplier_name: string
}

// ─── State ────────────────────────────────────────────────────────────────────
const state = reactive<{
  description: string
  po_date: string
  payment_term: string
  remarks: string
  save_as_draft: boolean
}>({
  description: '',
  po_date: new Date().toISOString().split('T')[0],
  payment_term: '',
  remarks: '',
  save_as_draft: true
})

const selectedSource = ref<SourceItem | null>(null)
const loadedSourceData = ref<MpoSourceData | null>(null)
const isLoadingSource = ref(false)

// Semua part dari source — ditampilkan sebagai daftar pilihan
const sourceParts = ref<{
  part_id: number
  part_number: string
  part_name: string
  uom_code: string
  qty: number           // qty dari MPR/MRP, sebagai default
  price: number
  supplier_id: number | undefined
  supplier_name: string
  inCart: boolean       // sudah ditambahkan ke keranjang atau belum
}[]>([])

// Keranjang — hanya part yang sudah diklik "tambah"
const cartItems = ref<CartItem[]>([])

// supplier_id header MPO = supplier dari item pertama di keranjang
// (semua item diasumsikan satu supplier per MPO)
const headerSupplierId = computed<number | undefined>(() =>
  cartItems.value[0]?.supplier_id
)
const headerSupplierName = computed<string>(() =>
  cartItems.value[0]?.supplier_name ?? '-'
)

// ─── Source dropdown ──────────────────────────────────────────────────────────
const sourceItems = computed<SourceItem[]>(() => store.sourceDropdown as SourceItem[])
const selectedSourceLabel = computed({
  get: () => selectedSource.value?.label ?? '',
  set: (val: string) => {
    const found = sourceItems.value.find(s => s.label === val) ?? null
    selectedSource.value = found
  }
})

// ─── Sync edit data ───────────────────────────────────────────────────────────
watch(
  () => props.mpo,
  (val) => {
    state.description = val.description ?? ''
    state.po_date = val.po_date ?? new Date().toISOString().split('T')[0]
    state.payment_term = val.payment_term ?? ''
    state.remarks = val.remarks ?? ''
    state.save_as_draft = true
  },
  { immediate: true, deep: true }
)

// ─── Reset saat modal dibuka (mode add) ──────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.mode === 'add') {
      selectedSource.value = null
      loadedSourceData.value = null
      sourceParts.value = []
      cartItems.value = []
      state.description = ''
      state.po_date = new Date().toISOString().split('T')[0]
      state.payment_term = ''
      state.remarks = ''
      state.save_as_draft = true
      store.fetchDropdownSource()
    }
  }
)

// ─── Load source data saat user memilih source ────────────────────────────────
watch(selectedSource, async (val) => {
  if (!val) {
    loadedSourceData.value = null
    sourceParts.value = []
    cartItems.value = []
    return
  }

  isLoadingSource.value = true
  try {
    const data = await store.loadSourceData(val.source_type, val.source_id)
    loadedSourceData.value = data
    cartItems.value = []   // reset keranjang saat ganti source

    if (data?.details) {
      sourceParts.value = data.details.map((d: any) => ({
        part_id: d.part_id,
        part_number: d.part?.part_number ?? '',
        part_name: d.part?.part_name ?? '',
        uom_code: d.part?.uom?.code ?? '',
        qty: d.qty ?? 1,
        price: d.part?.price ?? 0,
        // Ambil supplier_id & name dari data part (sudah di-include backend)
        supplier_id: d.part?.supplier?.id ?? d.part?.supplier_id ?? undefined,
        supplier_name: d.part?.supplier?.name ?? '',
        inCart: false
      }))
    }
  } catch {
    loadedSourceData.value = null
    sourceParts.value = []
    cartItems.value = []
  } finally {
    isLoadingSource.value = false
  }
})

// ─── Tambah part ke keranjang ─────────────────────────────────────────────────
function addToCart(part: typeof sourceParts.value[0]) {
  if (part.inCart) return
  cartItems.value.push({
    part_id: part.part_id,
    part_number: part.part_number,
    part_name: part.part_name,
    uom_code: part.uom_code,
    qty: part.qty,
    price: part.price,
    supplier_id: part.supplier_id,
    supplier_name: part.supplier_name
  })
  part.inCart = true
}

// ─── Hapus part dari keranjang ────────────────────────────────────────────────
function removeFromCart(partId: number) {
  cartItems.value = cartItems.value.filter(c => c.part_id !== partId)
  const sp = sourceParts.value.find(p => p.part_id === partId)
  if (sp) sp.inCart = false
}

// ─── Submit ───────────────────────────────────────────────────────────────────
function submitForm() {
  formRef.value?.submit()
}

function onSubmit(event: FormSubmitEvent<any>) {
  if (props.mode === 'add') {
    emit('save', {
      source_type: selectedSource.value?.source_type ?? undefined,
      source_id: selectedSource.value?.source_id ?? undefined,
      supplier_id: headerSupplierId.value,
      description: event.data.description || undefined,
      po_date: state.po_date,
      payment_term: state.payment_term || undefined,
      remarks: state.remarks || undefined,
      action: state.save_as_draft ? 'draft' : 'submit',
      details: cartItems.value.map(d => ({
        part_id: d.part_id,
        qty: d.qty,
        price: d.price,
        notes: d.notes
      }))
    })
  } else {
    emit('save', {
      description: event.data.description || undefined,
      po_date: state.po_date,
      payment_term: state.payment_term || undefined,
      remarks: state.remarks || undefined
    })
  }
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    :title="props.mode === 'add' ? 'Create MPO' : 'Edit MPO'"
    :description="props.mode === 'add'
      ? 'Create a new Material Purchase Order.'
      : 'Update MPO header information.'"
    class="sm:max-w-5xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <!-- ── Source Dropdown (Add only) ──────────────────────────────────── -->
        <template v-if="mode === 'add'">
          <UFormField label="Source (MRP / MPR)" name="source">
            <USelectMenu
              v-model="selectedSourceLabel"
              :items="sourceItems.map(s => s.label)"
              class="w-full"
              placeholder="Pilih dokumen MRP atau MPR..."
              searchable
              clear
            />
          </UFormField>

          <!-- Loading indicator -->
          <div v-if="isLoadingSource" class="flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
            Memuat item dari dokumen sumber...
          </div>

          <!-- ── Dua kolom: Daftar Part (kiri) | Keranjang MPO (kanan) ─────── -->
          <div v-if="loadedSourceData && !isLoadingSource" class="grid grid-cols-2 gap-4">
            <!-- KIRI: Daftar Part dari Source -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-muted uppercase tracking-wide">
                Part dari {{ loadedSourceData.source_number }}
              </p>
              <div class="border border-default rounded-lg overflow-hidden">
                <div
                  v-for="part in sourceParts"
                  :key="part.part_id"
                  class="flex items-center justify-between gap-2 px-3 py-2 border-b border-default last:border-0 hover:bg-elevated/30 transition-colors"
                  :class="part.inCart ? 'opacity-40' : ''"
                >
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-medium truncate">
                      {{ part.part_number }}
                    </p>
                    <p class="text-xs text-muted truncate">
                      {{ part.part_name }}
                    </p>
                    <p class="text-xs text-muted/70 mt-0.5">
                      Supplier: <span class="font-medium">{{ part.supplier_name || '—' }}</span>
                    </p>
                  </div>
                  <UButton
                    size="xs"
                    :icon="part.inCart ? 'i-lucide-check' : 'i-lucide-plus'"
                    :color="part.inCart ? 'success' : 'primary'"
                    variant="soft"
                    :disabled="part.inCart"
                    :title="part.inCart ? 'Sudah ditambahkan' : 'Tambah ke MPO'"
                    @click="addToCart(part)"
                  />
                </div>
                <div v-if="sourceParts.length === 0" class="p-4 text-center text-xs text-muted">
                  Tidak ada part ditemukan.
                </div>
              </div>
            </div>

            <!-- KANAN: Keranjang MPO -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-muted uppercase tracking-wide">
                  Item MPO
                </p>
                <UBadge color="primary" variant="subtle" size="xs">
                  {{ cartItems.length }} item
                </UBadge>
              </div>

              <!-- Info supplier otomatis terisi -->
              <div
                v-if="cartItems.length > 0"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
              >
                <UIcon name="i-lucide-building-2" class="w-3.5 h-3.5 text-primary shrink-0" />
                <p class="text-xs text-primary-700 dark:text-primary-300">
                  Supplier: <span class="font-semibold">{{ headerSupplierName }}</span>
                </p>
              </div>

              <div class="border border-default rounded-lg overflow-hidden">
                <div v-if="cartItems.length === 0" class="p-4 text-center text-xs text-muted">
                  Klik <UIcon name="i-lucide-plus" class="inline w-3 h-3" /> pada part di kiri untuk menambahkan.
                </div>

                <div
                  v-for="item in cartItems"
                  :key="item.part_id"
                  class="border-b border-default last:border-0 px-3 py-2"
                >
                  <!-- Nama part -->
                  <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-medium truncate">
                        {{ item.part_number }}
                      </p>
                      <p class="text-xs text-muted truncate">
                        {{ item.part_name }}
                      </p>
                    </div>
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="removeFromCart(item.part_id)"
                    />
                  </div>
                  <!-- Qty & Price inline -->
                  <div class="flex gap-2">
                    <div class="flex-1">
                      <p class="text-xs text-muted mb-0.5">
                        Qty ({{ item.uom_code }})
                      </p>
                      <UInput
                        v-model.number="item.qty"
                        type="number"
                        size="sm"
                        min="1"
                        class="w-full"
                      />
                    </div>
                    <div class="flex-1">
                      <p class="text-xs text-muted mb-0.5">
                        Price
                      </p>
                      <UInput
                        v-model.number="item.price"
                        type="number"
                        size="sm"
                        min="0"
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── PO Date & Payment Term ───────────────────────────────────────── -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="PO Date" name="po_date" required>
            <UInput v-model="state.po_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Payment Term" name="payment_term">
            <UInput v-model="state.payment_term" placeholder="e.g. Net 30" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UInput v-model="state.description" placeholder="Enter PO description..." class="w-full" />
        </UFormField>

        <UFormField label="Remarks" name="remarks">
          <UTextarea
            v-model="state.remarks"
            placeholder="Additional remarks..."
            class="w-full"
            rows="2"
          />
        </UFormField>

        <!-- ── Save mode toggle ────────────────────────────────────────────── -->
        <div class="flex items-center gap-3 pt-1">
          <UCheckbox v-model="state.save_as_draft" />
          <div>
            <p class="text-sm font-medium">
              Save as Draft
            </p>
            <p class="text-xs text-muted">
              Uncheck to directly submit to Supervisor for review.
            </p>
          </div>
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
          :label="state.save_as_draft ? 'Save as Draft' : 'Submit'"
          :icon="state.save_as_draft ? 'i-lucide-save' : 'i-lucide-send'"
          :loading="props.loading"
          @click="submitForm"
        />
      </div>
    </template>
  </UModal>
</template>