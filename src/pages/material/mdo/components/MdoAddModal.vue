<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive, watch, computed, ref } from 'vue'
import * as z from 'zod'
import { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useMdoStore } from '../../../../stores/material/mdo.store'
import type { MdoDropdownMpo, MdoDropdownMpoDetail } from '../../../../types/material/mdo'

const formRef = ref()
const store = useMdoStore()

// ─── Preview Warning State ─────────────────────────────────────────────────────
// Diset ke true oleh hasil previewSplit jika ada part dengan weight = null/0
const previewHasNullWeight = ref(false)

// ─── Cache Berat Barang ────────────────────────────────────────────────────────
// Menyimpan berat per-unit (kg) masing-masing part setelah previewSplit dipanggil.
// Key: part_id, Value: weight_per_unit_kg
// Ini memungkinkan kalkulasi total berat dilakukan 100% di frontend secara reaktif
// tanpa perlu memanggil API setiap kali user mengubah Qty atau men-ceklis item.
const partWeights = ref<Record<number, number>>({})

// ─── Preview Capacity State ────────────────────────────────────────────────────
// Hanya menyimpan kapasitas kendaraan (vehicle_capacity_kg) dari response previewSplit.
// total_weight_kg tidak lagi disimpan di sini — digantikan oleh liveTotalWeight computed.
const previewWeight = reactive({
  total_weight_kg: 0 as number, // ← dipertahankan untuk kompatibilitas template footer
  vehicle_capacity_kg: 0 as number,
  loaded: false, // true jika sudah ada data kapasitas kendaraan yang valid
})

const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: any]
}>()

// ─── Computed: Available Time Options (dari slot dock yang dipilih) ────────────
// Jika dock sudah dipilih → filter slot yang available === true.
// Jika dock belum dipilih → kembalikan array kosong (dropdown di-disable).
const availableTimeOptions = computed<string[]>(() => {
  if (!selectedDock.value) return []
  const slots = (selectedDock.value as any).slots ?? []
  return slots
    .filter((s: { time: string; available: boolean }) => s.available)
    .map((s: { time: string; available: boolean }) => s.time)
})

// ─── Warning: Jam yang sudah dipilih menjadi tidak tersedia ────────────────────
// Muncul ketika user mengganti tanggal/dock dan target_time yang sudah dipilih
// tidak lagi ada di availableTimeOptions.
const timeConflictWarning = computed<boolean>(() => {
  if (!state.target_time || !selectedDock.value) return false
  return !availableTimeOptions.value.includes(state.target_time)
})

// ─── Computed: Live Total Weight (Kalkulasi Instan di Frontend) ───────────────
// Me-loop state.details secara reaktif. Setiap kali user mengubah Qty atau
// men-ceklis/uncheck item, nilai ini langsung terupdate TANPA memanggil API.
// Menggunakan cache partWeights yang diisi sekali saat previewSplit pertama kali
// dipanggil (saat mpo_id & vehicle_id dipilih).
const liveTotalWeight = computed<number>(() => {
  return state.details.reduce((total, d) => {
    if (!d.selected) return total
    const weight = partWeights.value[d.part_id] ?? 0
    return total + Number(d.qty) * weight
  }, 0)
})

// ─── Computed: Kapasitas Terlampaui ────────────────────────────────────────────
// Bernilai true jika data preview sudah ada DAN liveTotalWeight > kapasitas kendaraan.
const isLoadExceeded = computed<boolean>(() => {
  if (!previewWeight.loaded || previewWeight.vehicle_capacity_kg <= 0) return false
  return liveTotalWeight.value > previewWeight.vehicle_capacity_kg
})

// ─── Computed: Disable Tombol Submit ──────────────────────────────────────────
// Blokir submit jika beban melebihi kapasitas ATAU ada konflik jadwal.
const isSubmitDisabled = computed<boolean>(() => {
  return props.loading || isLoadExceeded.value || timeConflictWarning.value
})
const state = reactive({
  mpo_id: undefined as number | undefined,
  target_date: '',
  target_time: '' as string | undefined,
  dock_id: undefined as number | undefined,
  vehicle_id: undefined as number | undefined,
  transporter: '' as string | undefined,
  description: '' as string | undefined,
  remarks: '' as string | undefined,
  save_as: 'draft' as 'draft' | 'scheduled',
  // Part details derived from selected MPO
  details: [] as { part_id: number; qty: number; notes?: string | null; label: string; max_qty: number; selected: boolean }[]
})

// CalendarDate bridge for UInputDate
const targetDateModel = computed({
  get() {
    if (!state.target_date) return null
    const [y, m, d] = state.target_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) { state.target_date = ''; return }
    state.target_date = `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
  }
})

// ─── Validation Schema ─────────────────────────────────────────────────────────
const schema = z.object({
  mpo_id: z.number({ message: 'MPO harus dipilih' }),
  target_date: z.string().min(1, 'Tanggal pengiriman harus diisi'),
})

// ─── Computed: Selected MPO object ────────────────────────────────────────────
const selectedMpo = computed({
  get: () => store.mpoItems.find(m => m.id === state.mpo_id),
  set: (val: MdoDropdownMpo | undefined) => {
    state.mpo_id = val?.id
    // Reset details when MPO changes
    buildDetailsFromMpo(val)
  }
})

function buildDetailsFromMpo(mpo: MdoDropdownMpo | undefined) {
  if (!mpo?.details) {
    state.details = []
    return
  }
  state.details = mpo.details
    .filter((d: MdoDropdownMpoDetail) => d.remaining_qty > 0)
    .map((d: MdoDropdownMpoDetail) => ({
      part_id: d.id,
      qty: d.remaining_qty,
      notes: null,
      label: `${d.part_name} (${d.part_number})`,
      max_qty: d.remaining_qty,
      selected: false,
    }))
}

// ─── Computed: Docks (filtered by date, loaded after date selected) ────────────
const selectedDock = computed({
  get: () => store.docks.find(d => d.id === state.dock_id),
  set: (val: any) => { state.dock_id = val?.id }
})

// ─── Computed: Vehicles ────────────────────────────────────────────────────────
const selectedVehicle = computed({
  get: () => store.vehicles.find(v => v.id === state.vehicle_id),
  set: (val: any) => { state.vehicle_id = val?.id }
})

const vehicleLabel = (v: any) =>
  v ? `${v.plate_number} — ${v.vehicle_type?.name || ''} (${v.vehicle_type?.load_capacity ?? '-'} kg)` : ''

// ─── Watch: Reload docks & vehicles when date changes ─────────────────────────
// Juga reset target_time karena slot availability bisa berubah di tanggal berbeda.
watch(
  () => state.target_date,
  async (date) => {
    if (!date) return
    state.dock_id = undefined
    state.vehicle_id = undefined
    state.target_time = undefined  // reset jam agar tidak stale
    await Promise.all([
      store.fetchDropdownDocks({ date }),
      store.fetchDropdownVehicles({ date }),
    ])
  }
)

// ─── Watch: Reset target_time jika dock berubah ────────────────────────────────
// Ketika dock diganti, slot yang tersedia bisa berbeda → jam yang dipilih sebelumnya
// mungkin sudah terpakai di dock baru.
watch(
  () => state.dock_id,
  () => {
    // Hanya reset jika jam yang dipilih tidak ada di slot dock baru
    if (state.target_time && !availableTimeOptions.value.includes(state.target_time)) {
      state.target_time = undefined
    }
  }
)

// ─── Watch: Auto-call previewSplit HANYA saat MPO atau Vehicle berubah ────────
// state.details TIDAK lagi dipantau di sini — kalkulasi berat kini dilakukan
// secara reaktif via liveTotalWeight computed, menggunakan cache partWeights.
// Ini menghilangkan race condition & spam API saat user mengubah Qty/checkbox.
watch(
  [() => state.mpo_id, () => state.vehicle_id],
  async ([mpoId, vehicleId]) => {
    previewHasNullWeight.value = false
    previewWeight.loaded = false

    if (!mpoId || !vehicleId) {
      previewWeight.total_weight_kg = 0
      previewWeight.vehicle_capacity_kg = 0
      partWeights.value = {} // reset cache saat vehicle/MPO di-unset
      return
    }

    try {
      // Kirim minimal payload: hanya mpo_id & vehicle_id.
      // Backend cukup mengembalikan kapasitas kendaraan + berat per-unit setiap part.
      const res = await store.previewSplit({
        mpo_id: mpoId,
        vehicle_id: vehicleId,
        details: [], // kosong — backend hanya dipakai untuk seed data berat, bukan kalkulasi
      })

      // Tahan response berbungkus (res.data) maupun yang sudah di-unwrap (res)
      const payload = res?.data ?? res

      if (payload && typeof payload.vehicle_capacity_kg !== 'undefined') {
        previewHasNullWeight.value = !!payload.has_null_weight

        // Simpan kapasitas kendaraan ke previewWeight
        previewWeight.vehicle_capacity_kg = payload.vehicle_capacity_kg ?? 0
        previewWeight.loaded = true

        // ── Seed cache berat per-unit ke partWeights ──────────────────────────
        // Loop suggested_qty_details dari backend untuk mengisi cache lokal.
        // Setelah ini, semua kalkulasi berat dilakukan murni di frontend via
        // liveTotalWeight computed — tanpa API call tambahan.
        const newCache: Record<number, number> = {}
        if (Array.isArray(payload.suggested_qty_details)) {
          for (const item of payload.suggested_qty_details) {
            newCache[item.part_id] = item.weight_per_unit_kg || 0
          }
        }
        partWeights.value = newCache
      }
    } catch (error) {
      // Preview gagal → tidak blok user, cukup reset indikator
      console.error('Gagal mengambil data kapasitas:', error)
      previewHasNullWeight.value = false
      previewWeight.loaded = false
      partWeights.value = {}
    }
  }
)

// ─── Watch: Open → reset & load dropdowns ────────────────────────────────────
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    // Reset
    state.mpo_id = undefined
    state.target_date = ''
    state.target_time = undefined
    state.dock_id = undefined
    state.vehicle_id = undefined
    state.transporter = ''
    state.description = ''
    state.remarks = ''
    state.save_as = 'draft'
    state.details = []
    previewHasNullWeight.value = false
    previewWeight.total_weight_kg = 0
    previewWeight.vehicle_capacity_kg = 0
    previewWeight.loaded = false
    partWeights.value = {} // reset cache berat saat modal dibuka ulang
    // Load MPO dropdown
    await store.fetchDropdownMpo()
  }
)

// ─── Form Submit ───────────────────────────────────────────────────────────────
function submitForm(saveAs: 'draft' | 'scheduled') {
  state.save_as = saveAs
  formRef.value?.submit()
}

function onSubmit(_event: FormSubmitEvent<any>) {
  // ── Guard lapis-2: blokir submit jika muatan melebihi kapasitas ─────────────
  // Ini melengkapi :disabled="isSubmitDisabled" di tombol — mencegah celah
  // race-condition atau bypass lewat keyboard shortcut / manipulasi DOM.
  if (isLoadExceeded.value) {
    alert('Total muatan melebihi kapasitas maksimal kendaraan! Kurangi qty atau pilih kendaraan lain.')
    return
  }

  if (state.details.length === 0) {
    alert('Pilih MPO yang memiliki detail parts terlebih dahulu.')
    return
  }

  const selectedDetails = state.details.filter(d => d.selected)
  if (selectedDetails.length === 0) {
    alert('Pilih minimal 1 part untuk dikirim.')
    return
  }

  const payload: any = {
    mpo_id: state.mpo_id,
    target_date: state.target_date,
    target_time: state.target_time ? `${state.target_time}:00` : null,
    dock_id: state.dock_id ?? null,
    vehicle_id: state.vehicle_id ?? null,
    transporter: state.transporter || null,
    description: state.description || null,
    remarks: state.remarks || null,
    save_as: state.save_as,
    details: selectedDetails.map(d => ({
      part_id: d.part_id,
      qty: Number(d.qty),
      notes: d.notes || null,
    }))
  }

  emit('save', payload)
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    title="Buat Material Delivery Order (MDO)"
    description="Jadwalkan pengiriman material dari supplier ke receiving dock gudang."
    class="sm:max-w-4xl"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        ref="formRef"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- ── Kolom Kiri: Konfigurasi Utama ────────────────────────────── -->
          <div class="space-y-4">
            <!-- MPO -->
            <UFormField label="Material Purchase Order (MPO)" name="mpo_id" required>
              <USelectMenu
                v-model="selectedMpo"
                :items="store.mpoItems"
                class="w-full"
                placeholder="Pilih MPO yang akan dikirim"
                label-key="number"
              >
                <template #option="{ item }">
                  <div class="flex flex-col py-0.5">
                    <span class="font-bold text-xs text-default">{{ item.number }}</span>
                    <span v-if="item.supplier_name" class="text-[10px] text-muted">{{ item.supplier_name }}</span>
                    <span v-if="item.description" class="text-[10px] text-muted/70 truncate">{{ item.description }}</span>
                  </div>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Target Date -->
            <UFormField label="Tanggal Pengiriman" name="target_date" required>
              <UInputDate v-model="targetDateModel" class="w-full">
                <template #trailing>
                  <UPopover>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-calendar"
                      class="px-0"
                    />
                    <template #content>
                      <UCalendar v-model="targetDateModel" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>

            <!-- Receiving Dock — harus dipilih dulu sebelum memilih jam -->
            <UFormField label="Receiving Dock" name="dock_id">
              <USelectMenu
                v-model="selectedDock"
                :items="store.docks"
                class="w-full"
                placeholder="Pilih dock penerimaan"
                label-key="name"
                :disabled="!state.target_date"
              >
                <template #option="{ item }">
                  <div class="flex flex-col py-0.5">
                    <span class="font-bold text-xs text-default">{{ item.name }}</span>
                    <span v-if="item.area" class="text-[10px] text-muted">Area: {{ item.area.name }}</span>
                    <span class="text-[10px] text-muted/70">
                      {{ (item.slots ?? []).filter((s: any) => s.available).length }} slot tersedia
                    </span>
                  </div>
                </template>
                <template #empty>
                  <p class="text-xs text-muted p-2">
                    {{ !state.target_date ? 'Isi tanggal dulu untuk melihat dock tersedia' : 'Tidak ada dock tersedia' }}
                  </p>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Warning: jam yang dipilih tidak lagi available setelah dock/tanggal diganti -->
            <div
              v-if="timeConflictWarning"
              class="flex items-start gap-2.5 rounded-xl border border-red-400/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-800 dark:text-red-300"
            >
              <UIcon name="i-lucide-clock-alert" class="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div class="text-xs leading-relaxed">
                <span class="font-bold block">Slot Waktu Tidak Tersedia</span>
                Jam <span class="font-mono font-bold">{{ state.target_time }}</span> yang sebelumnya dipilih
                sudah tidak tersedia di dock atau tanggal yang baru. Silakan pilih jam lain.
              </div>
            </div>

            <!-- Target Time — disabled sampai dock dipilih, hanya tampilkan slot available -->
            <UFormField label="Jam Kedatangan (Opsional)" name="target_time">
              <USelectMenu
                v-model="state.target_time"
                :items="availableTimeOptions"
                class="w-full"
                :placeholder="!state.dock_id ? 'Pilih Receiving Dock terlebih dahulu' : 'Pilih jam kedatangan'"
                :disabled="!state.dock_id"
              >
                <template #empty>
                  <p class="text-xs text-muted p-2">
                    {{ !state.dock_id ? 'Pilih dock dulu' : 'Tidak ada slot waktu yang tersedia di dock ini' }}
                  </p>
                </template>
              </USelectMenu>
              <p v-if="state.dock_id && availableTimeOptions.length === 0" class="text-[10px] text-red-500 mt-1">
                Semua slot waktu di dock ini sudah penuh pada tanggal tersebut.
              </p>
            </UFormField>

            <!-- Vehicle -->
            <UFormField label="Kendaraan Pengantar" name="vehicle_id">
              <USelectMenu
                v-model="selectedVehicle"
                :items="store.vehicles"
                class="w-full"
                placeholder="Pilih kendaraan"
                label-key="plate_number"
                searchable
                :search-attributes="['plate_number', 'vehicle_code']"
                :disabled="!state.target_date"
              >
                <template #label>
                  <span v-if="selectedVehicle" class="text-xs">{{ vehicleLabel(selectedVehicle) }}</span>
                  <span v-else class="text-muted text-xs">Pilih kendaraan</span>
                </template>
                <template #option="{ item }">
                  <div class="flex flex-col py-0.5">
                    <span class="font-bold text-xs text-default font-mono">{{ item.plate_number }}</span>
                    <span class="text-[10px] text-muted">
                      {{ item.vehicle_code }} · {{ item.vehicle_type?.name || '-' }} · {{ item.vehicle_type?.load_capacity ?? '-' }} kg
                    </span>
                  </div>
                </template>
                <template #empty>
                  <p class="text-xs text-muted p-2">
                    {{ !state.target_date ? 'Isi tanggal dulu untuk melihat kendaraan tersedia' : 'Tidak ada kendaraan tersedia' }}
                  </p>
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Transporter (nama ekspedisi jika tidak pakai vehicle internal) -->
            <UFormField label="Nama Transporter / Ekspedisi (Opsional)" name="transporter">
              <UInput
                v-model="state.transporter"
                placeholder="Contoh: JNE, TIKI, atau nama sopir"
                class="w-full"
              />
            </UFormField>

            <!-- Description -->
            <UFormField label="Deskripsi (Opsional)" name="description">
              <UTextarea
                v-model="state.description"
                placeholder="Deskripsi singkat MDO ini..."
                :rows="2"
                class="w-full"
              />
            </UFormField>

            <!-- Remarks -->
            <UFormField label="Catatan / Remarks (Opsional)" name="remarks">
              <UTextarea
                v-model="state.remarks"
                placeholder="Catatan tambahan untuk penerima..."
                :rows="2"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- ── Kolom Kanan: Detail Parts dari MPO ───────────────────────── -->
          <div class="flex flex-col h-full gap-3">

            <!-- ── Indikator Kapasitas Muatan Real-time ──────────────────── -->
            <!-- Muncul segera setelah vehicle_id dipilih, sebelum dokumen disimpan -->
            <Transition name="capacity-fade">
              <div
                v-if="state.vehicle_id"
                class="p-3 rounded-xl border space-y-2 transition-colors duration-300"
                :class="previewWeight.loaded
                  ? (isLoadExceeded
                      ? 'border-red-400/60 bg-red-50 dark:bg-red-900/20'
                      : 'border-green-400/60 bg-green-50 dark:bg-green-900/20')
                  : 'border-default bg-elevated/50'"
              >
                <!-- Header row: label + angka -->
                <div class="flex justify-between items-center text-xs font-medium">
                  <span class="text-muted flex items-center gap-1">
                    <UIcon name="i-lucide-weight" class="w-3.5 h-3.5" />
                    Kapasitas Muatan Truk:
                  </span>
                  <span
                    v-if="previewWeight.loaded"
                    class="font-mono font-bold"
                    :class="isLoadExceeded ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'"
                  >
                    {{ liveTotalWeight.toFixed(1) }} kg
                    / {{ previewWeight.vehicle_capacity_kg.toFixed(1) }} kg
                    <span class="ml-1">
                      ({{ previewWeight.vehicle_capacity_kg > 0
                        ? Math.round((liveTotalWeight / previewWeight.vehicle_capacity_kg) * 100)
                        : 0 }}%)
                    </span>
                  </span>
                  <span v-else class="text-muted italic text-[10px]">Menghitung…</span>
                </div>

                <!-- Progress bar -->
                <div class="w-full bg-default/20 rounded-full h-2.5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500 ease-out"
                    :class="!previewWeight.loaded
                      ? 'bg-muted/40 animate-pulse w-full'
                      : isLoadExceeded ? 'bg-red-500' : 'bg-green-500'"
                    :style="previewWeight.loaded && previewWeight.vehicle_capacity_kg > 0
                      ? { width: `${Math.min((liveTotalWeight / previewWeight.vehicle_capacity_kg) * 100, 100)}%` }
                      : {}"
                  />
                </div>

                <!-- Overload warning -->
                <p
                  v-if="previewWeight.loaded && isLoadExceeded"
                  class="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 animate-pulse"
                >
                  ⚠️ Muatan Overload! Kurangi item atau ganti kendaraan yang lebih besar.
                </p>
                <!-- OK status -->
                <p
                  v-else-if="previewWeight.loaded && !isLoadExceeded"
                  class="text-[11px] text-green-700 dark:text-green-400 font-medium flex items-center gap-1"
                >
                  ✅ Muatan dalam batas aman kendaraan.
                </p>
              </div>
            </Transition>

            <!-- ⚠️ Alert: Peringatan Weight Null/0 dari Preview Split -->
            <div
              v-if="previewHasNullWeight"
              class="flex items-start gap-2.5 rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-amber-800 dark:text-amber-300"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div class="text-xs leading-relaxed">
                <span class="font-bold block">Peringatan: Data Berat Tidak Lengkap</span>
                Beberapa barang belum memiliki data berat di sistem (Weight = 0).
                Perhitungan muatan otomatis mungkin tidak akurat.
                Harap lengkapi data master Parts sebelum menjadwalkan pengiriman.
              </div>
            </div>

            <div class="flex flex-col h-full border border-default rounded-xl overflow-hidden bg-elevated/20">
            <div class="p-3 bg-elevated border-b border-default shrink-0 flex items-center justify-between">
              <h4 class="text-sm font-bold text-default flex items-center gap-1.5">
                <UIcon name="i-lucide-package-2" class="text-primary w-4 h-4" />
                <span>Detail Parts (dari MPO)</span>
              </h4>
              <UBadge
                color="primary"
                variant="subtle"
                size="xs"
                class="rounded-full"
              >
                {{ state.details.filter(d => d.selected).length }} / {{ state.details.length }} dipilih
              </UBadge>
            </div>

            <!-- Empty: no MPO selected -->
            <div v-if="!state.mpo_id" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <UIcon name="i-lucide-file-search" class="w-10 h-10 text-muted mb-3 opacity-40" />
              <p class="text-xs text-muted font-medium">
                Pilih MPO terlebih dahulu
              </p>
              <p class="text-[10px] text-muted/70 mt-1">
                Parts dari MPO yang dipilih akan muncul di sini.
              </p>
            </div>

            <!-- Empty: MPO has no remaining parts -->
            <div v-else-if="state.details.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <UIcon name="i-lucide-check-circle" class="w-10 h-10 text-success-500 mb-3 opacity-70" />
              <p class="text-xs text-muted font-medium">
                Semua parts sudah terpenuhi
              </p>
              <p class="text-[10px] text-muted/70 mt-1">
                Tidak ada remaining qty pada MPO ini.
              </p>
            </div>

            <!-- Parts list -->
            <div v-else class="flex-1 overflow-y-auto divide-y divide-default">
              <div
                v-for="(detail, idx) in state.details"
                :key="detail.part_id"
                class="p-4 hover:bg-elevated/40 transition-colors"
                :class="{ 'opacity-40': !state.details[idx].selected }"
              >
                <div class="flex items-start gap-3">
                  <!-- Checkbox pilih part -->
                  <div class="pt-0.5 shrink-0">
                    <UCheckbox v-model="state.details[idx].selected" />
                  </div>

                  <div class="flex-1 min-w-0 flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-default truncate">
                        {{ detail.label }}
                      </p>
                      <p class="text-[10px] text-muted mt-0.5">
                        Maks: {{ detail.max_qty }} pcs
                      </p>

                      <!-- Notes input per part -->
                      <UInput
                        v-model="state.details[idx].notes"
                        placeholder="Catatan part (opsional)"
                        size="xs"
                        class="mt-2 w-full"
                        :disabled="!state.details[idx].selected"
                      />
                    </div>

                    <!-- Qty input -->
                    <div class="text-right shrink-0 w-28">
                      <span class="text-[10px] font-semibold text-muted block mb-1">Qty Kirim</span>
                      <UInput
                        v-model="state.details[idx].qty"
                        type="number"
                        min="1"
                        :max="detail.max_qty"
                        size="sm"
                        class="text-right"
                        :disabled="!state.details[idx].selected"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- MPO info footer -->
            <div v-if="selectedMpo" class="p-3 border-t border-default bg-elevated/30 shrink-0">
              <p class="text-[10px] text-muted">
                MPO: <span class="font-bold text-default">{{ selectedMpo.number }}</span>
                <span v-if="selectedMpo.supplier_name"> · {{ selectedMpo.supplier_name }}</span>
              </p>
            </div>
          </div>
          </div> <!-- /.flex.flex-col.h-full.gap-3 (wrapper kolom kanan) -->
        </div>
      </UForm>
    </template>

    <template #footer>
      <!-- ── Panel Ringkasan Kapasitas Muatan ─────────────────────────────── -->
      <div
        v-if="previewWeight.loaded"
        class="flex items-center gap-2 mr-auto px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
        :class="isLoadExceeded
          ? 'border-red-400/60 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          : 'border-green-400/60 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'"
      >
        <UIcon
          :name="isLoadExceeded ? 'i-lucide-weight' : 'i-lucide-check-circle-2'"
          class="w-3.5 h-3.5 shrink-0"
        />
        <span>
          Planned Load:
          <span class="font-mono">{{ liveTotalWeight.toFixed(1) }} kg</span>
          /
          <span class="font-mono">{{ previewWeight.vehicle_capacity_kg.toFixed(1) }} kg</span>
        </span>
        <span v-if="isLoadExceeded" class="font-bold">— Melebihi Kapasitas!</span>
      </div>

      <div class="flex gap-2 justify-end w-full">
        <UButton
          color="neutral"
          variant="ghost"
          label="Batal"
          @click="close"
        />
        <UButton
          color="warning"
          variant="soft"
          label="Simpan Draft"
          icon="i-lucide-save"
          :loading="props.loading && state.save_as === 'draft'"
          :disabled="isSubmitDisabled"
          @click="submitForm('draft')"
        />
        <UButton
          color="primary"
          label="Jadwalkan (Scheduled)"
          icon="i-lucide-calendar-check"
          :loading="props.loading && state.save_as === 'scheduled'"
          :disabled="isSubmitDisabled"
          @click="submitForm('scheduled')"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Animasi fade masuk/keluar untuk blok indikator kapasitas */
.capacity-fade-enter-active,
.capacity-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.capacity-fade-enter-from,
.capacity-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>