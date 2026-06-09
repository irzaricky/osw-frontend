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

// Supplier tersedia untuk satu part (dari relasi M2M as: 'suppliers')
interface PartSupplier {
  id: number
  name: string
  supplier_code?: string
  is_primary?: boolean
}

// Satu item yang sudah masuk ke keranjang MPO
// qty TIDAK bisa diedit — mutlak mengikuti dokumen source (Strict Source)
interface CartItem {
  part_id: number
  part_number: string
  part_name: string
  uom_code: string
  qty: number               // Strict: diisi dari source, tidak bisa diubah user
  price: number
  notes?: string
  available_suppliers: PartSupplier[]   // Semua supplier yang bisa handle part ini
}

// ─── State ────────────────────────────────────────────────────────────────────
const state = reactive<{
  description: string
  po_date: string
  payment_term: string
  remarks: string
  save_as_draft: boolean
  // Supplier Header — 1 MPO = 1 Supplier
  supplier_id: number | undefined
  supplier_name: string
}>({
  description: '',
  po_date: new Date().toISOString().split('T')[0],
  payment_term: '',
  remarks: '',
  save_as_draft: true,
  supplier_id: undefined,
  supplier_name: ''
})

const selectedSource = ref<SourceItem | null>(null)
const loadedSourceData = ref<MpoSourceData | null>(null)
const isLoadingSource = ref(false)

// Semua part dari source — sebelum filter supplier
const sourceParts = ref<{
  part_id: number
  part_number: string
  part_name: string
  uom_code: string
  qty: number               // qty dari MPR/MRP — STRICT
  price: number
  // [M2M] Array supplier yang bisa handle part ini (dari as: 'suppliers')
  available_suppliers: PartSupplier[]
  inCart: boolean
}[]>([])

// Keranjang — hanya part yang sudah diklik "tambah"
const cartItems = ref<CartItem[]>([])

// ─── Supplier Header dropdown ─────────────────────────────────────────────────
// Jika keranjang KOSONG  → semua supplier unik dari seluruh sourceParts.
// Jika keranjang BERISI  → irisan (intersection): hanya supplier yang sanggup
//   melayani SEMUA item di keranjang sekaligus. Ini mencegah user memilih
//   supplier yang tidak bisa handle sebagian item yang sudah ada di keranjang.
const supplierOptions = computed(() => {
  if (cartItems.value.length === 0) {
    // Belum ada item — tampilkan semua supplier unik dari source
    const seen = new Set<number>()
    const list: PartSupplier[] = []
    for (const part of sourceParts.value) {
      for (const s of part.available_suppliers) {
        if (!seen.has(s.id)) {
          seen.add(s.id)
          list.push(s)
        }
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Ada item di keranjang — hitung irisan
  // Mulai dari available_suppliers item pertama sebagai patokan dasar
  let validSuppliers: PartSupplier[] = [...(cartItems.value[0].available_suppliers ?? [])]

  // Setiap item berikutnya mempersempit pilihan: hanya pertahankan supplier
  // yang juga ada di available_suppliers item tersebut
  for (let i = 1; i < cartItems.value.length; i++) {
    const nextIds = new Set(
      (cartItems.value[i].available_suppliers ?? []).map(s => s.id)
    )
    validSuppliers = validSuppliers.filter(s => nextIds.has(s.id))
  }

  return validSuppliers.sort((a, b) => a.name.localeCompare(b.name))
})

const supplierOptionLabels = computed(() => supplierOptions.value.map(s => s.name))

// ─── Computed: filter panel kiri berdasarkan Supplier Header ─────────────────
// Part tampil jika state.supplier_id termasuk di dalam available_suppliers-nya
const filteredSourceParts = computed(() => {
  if (!state.supplier_id) return sourceParts.value
  return sourceParts.value.filter(p =>
    p.available_suppliers.some(s => s.id === state.supplier_id)
  )
})

// ─── v-model label untuk USelectMenu Supplier Header ─────────────────────────
const selectedSupplierLabel = computed({
  get: () => state.supplier_name,
  set: (val: string) => {
    if (!val) {
      // User clear → lepas filter, reset keranjang
      state.supplier_id = undefined
      state.supplier_name = ''
      for (const p of sourceParts.value) p.inCart = false
      cartItems.value = []
      return
    }
    const found = supplierOptions.value.find(s => s.name === val)
    if (found) {
      state.supplier_id = found.id
      state.supplier_name = found.name
      // Ganti supplier → reset keranjang agar tidak tercampur
      for (const p of sourceParts.value) p.inCart = false
      cartItems.value = []
    }
  }
})

// ─── Source dropdown ──────────────────────────────────────────────────────────
const sourceItems = computed<SourceItem[]>(() => store.sourceDropdown as SourceItem[])
const selectedSourceLabel = computed({
  get: () => selectedSource.value?.label ?? '',
  set: (val: string) => {
    selectedSource.value = sourceItems.value.find(s => s.label === val) ?? null
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
    state.supplier_id = (val as any).supplier_id ?? undefined
    state.supplier_name = (val as any).supplier?.name ?? ''
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
      state.supplier_id = undefined
      state.supplier_name = ''
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
    state.supplier_id = undefined
    state.supplier_name = ''
    return
  }

  isLoadingSource.value = true
  try {
    const data = await store.loadSourceData(val.source_type, val.source_id)
    loadedSourceData.value = data
    cartItems.value = []
    state.supplier_id = undefined
    state.supplier_name = ''

    if (data?.details) {
      sourceParts.value = data.details.map((d: any) => ({
        part_id: d.part_id,
        part_number: d.part?.part_number ?? '',
        part_name: d.part?.part_name ?? '',
        uom_code: d.part?.uom?.code ?? '',
        qty: d.qty ?? 1,
        price: d.part?.price ?? 0,
        // [M2M] Petakan d.part.suppliers (array) → available_suppliers
        available_suppliers: (d.part?.suppliers ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          supplier_code: s.supplier_code,
          is_primary: s.SPartSuppliers?.is_primary ?? s.part_suppliers?.is_primary ?? false
        })),
        inCart: false
      }))
    }
  } catch {
    loadedSourceData.value = null
    sourceParts.value = []
    cartItems.value = []
    state.supplier_id = undefined
    state.supplier_name = ''
  } finally {
    isLoadingSource.value = false
  }
})

// ─── [UX Cerdas] Tambah part ke keranjang ────────────────────────────────────
// Jika Supplier Header kosong, auto-set dari primary supplier part (atau pertama).
// Part ditolak jika supplier yang dipilih di Header bukan bagian dari available_suppliers-nya.
function addToCart(part: typeof sourceParts.value[0]) {
  if (part.inCart) return

  // Auto-set Supplier Header dari part pertama yang diklik
  if (!state.supplier_id && part.available_suppliers.length > 0) {
    // Preferensikan is_primary, fallback ke index 0
    const primary = part.available_suppliers.find(s => s.is_primary) ?? part.available_suppliers[0]
    state.supplier_id = primary.id
    state.supplier_name = primary.name
  }

  // Guard: supplier yang aktif harus ada di available_suppliers part ini
  if (
    state.supplier_id &&
    !part.available_suppliers.some(s => s.id === state.supplier_id)
  ) return

  cartItems.value.push({
    part_id: part.part_id,
    part_number: part.part_number,
    part_name: part.part_name,
    uom_code: part.uom_code,
    qty: part.qty,      // STRICT — dikunci dari source
    price: part.price,
    available_suppliers: part.available_suppliers
  })
  part.inCart = true
}

// ─── Hapus part dari keranjang ────────────────────────────────────────────────
function removeFromCart(partId: number) {
  cartItems.value = cartItems.value.filter(c => c.part_id !== partId)
  const sp = sourceParts.value.find(p => p.part_id === partId)
  if (sp) sp.inCart = false

  // Lepas lock Supplier Header jika keranjang kembali kosong
  if (cartItems.value.length === 0) {
    state.supplier_id = undefined
    state.supplier_name = ''
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function subtotal(item: CartItem): number {
  return item.qty * item.price
}

const grandTotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + subtotal(item), 0)
)

// Nama supplier dari suatu part untuk ditampilkan di panel kiri
function supplierNames(part: typeof sourceParts.value[0]): string {
  if (!part.available_suppliers.length) return '—'
  return part.available_suppliers
    .map(s => s.is_primary ? `${s.name} ★` : s.name)
    .join(', ')
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
      supplier_id: state.supplier_id,
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
      supplier_id: state.supplier_id || undefined,
      description: event.data.description || undefined,
      po_date: state.po_date,
      payment_term: state.payment_term || undefined,
      remarks: state.remarks || undefined,
      action: state.save_as_draft ? 'draft' : 'submit',
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

          <!-- ── Supplier Header (muncul setelah source dipilih) ───────────── -->
          <template v-if="loadedSourceData && !isLoadingSource">
            <UFormField label="Supplier" name="supplier_id">
              <template #hint>
                <span class="text-xs text-muted">
                  1 MPO = 1 Supplier. Panel kiri otomatis terfilter.
                </span>
              </template>
              <USelectMenu
                v-model="selectedSupplierLabel"
                :items="supplierOptionLabels"
                class="w-full"
                placeholder="Pilih supplier atau klik Tambah pada part..."
                searchable
                clear
              >
                <template #leading>
                  <UIcon name="i-lucide-building-2" class="w-4 h-4 text-muted" />
                </template>
              </USelectMenu>
            </UFormField>
          </template>

          <!-- ── Dua kolom: Daftar Part (kiri) | Keranjang MPO (kanan) ─────── -->
          <div v-if="loadedSourceData && !isLoadingSource" class="grid grid-cols-2 gap-4">
            <!-- KIRI: Daftar Part dari Source -->
            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-semibold text-muted uppercase tracking-wide">
                  Part dari {{ loadedSourceData.source_number }}
                </p>
                <UBadge
                  v-if="state.supplier_id"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-filter"
                >
                  Filter: {{ state.supplier_name }}
                </UBadge>
              </div>
              <div class="border border-default rounded-lg overflow-hidden">
                <div
                  v-for="part in filteredSourceParts"
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
                      Qty: <span class="font-semibold">{{ part.qty }} {{ part.uom_code }}</span>
                    </p>
                    <!-- [M2M] Tampilkan semua nama supplier, primary diberi bintang -->
                    <p class="text-xs text-muted/70 mt-0.5 truncate" :title="supplierNames(part)">
                      Supplier: <span class="font-medium">{{ supplierNames(part) }}</span>
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
                <div v-if="filteredSourceParts.length === 0" class="p-4 text-center text-xs text-muted">
                  <template v-if="state.supplier_id">
                    Tidak ada part lain dari supplier ini.
                  </template>
                  <template v-else>
                    Tidak ada part ditemukan.
                  </template>
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

              <!-- Info supplier Header (read-only di keranjang) -->
              <div
                v-if="cartItems.length > 0"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
              >
                <UIcon name="i-lucide-building-2" class="w-3.5 h-3.5 text-primary shrink-0" />
                <p class="text-xs text-primary-700 dark:text-primary-300">
                  Supplier: <span class="font-semibold">{{ state.supplier_name }}</span>
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

                  <!-- [STRICT SOURCE] Qty, Price, Subtotal — semua read-only -->
                  <div class="flex gap-2">
                    <!-- Qty — teks statis + ikon gembok -->
                    <div class="flex-1">
                      <p class="text-xs text-muted mb-0.5">Qty ({{ item.uom_code }})</p>
                      <div class="flex items-center h-8 px-2.5 rounded-md border border-default bg-elevated/60 text-xs font-semibold text-highlighted">
                        {{ item.qty }}
                        <UIcon
                          name="i-lucide-lock"
                          class="w-3 h-3 ml-1.5 text-muted/60 shrink-0"
                          title="Qty dikunci dari dokumen source"
                        />
                      </div>
                    </div>

                    <!-- Price/Pcs — read-only -->
                    <div class="flex-1">
                      <p class="text-xs text-muted mb-0.5">Price/Pcs</p>
                      <div class="flex items-center h-8 px-2.5 rounded-md border border-default bg-elevated/40 text-xs text-highlighted opacity-70">
                        {{ item.price.toLocaleString('id-ID') }}
                      </div>
                    </div>

                    <!-- Subtotal = qty × price -->
                    <div class="flex-1">
                      <p class="text-xs text-muted mb-0.5">Subtotal</p>
                      <div class="flex items-center h-8 px-2.5 rounded-md border border-default bg-elevated/40 text-xs font-semibold text-highlighted whitespace-nowrap overflow-hidden">
                        {{ subtotal(item).toLocaleString('id-ID') }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Grand Total -->
                <div
                  v-if="cartItems.length > 0"
                  class="flex items-center justify-between px-3 py-2 bg-elevated/50 border-t border-default"
                >
                  <p class="text-xs text-muted font-medium">Total</p>
                  <p class="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {{ grandTotal.toLocaleString('id-ID') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Supplier Header (Edit mode) ────────────────────────────────── -->
        <template v-if="mode === 'edit'">
          <UFormField label="Supplier" name="supplier_id">
            <USelectMenu
              v-model="selectedSupplierLabel"
              :items="store.supplierDropdown?.map((s: any) => s.name) ?? []"
              class="w-full"
              placeholder="Pilih supplier..."
              searchable
            >
              <template #leading>
                <UIcon name="i-lucide-building-2" class="w-4 h-4 text-muted" />
              </template>
            </USelectMenu>
          </UFormField>
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
            <p class="text-sm font-medium">Save as Draft</p>
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