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

const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: any]
}>()

const timeOptions = [
  '06:00', '06:30',
  '07:00', '07:30',
  '08:00', '08:30',
  '09:00', '09:30',
  '10:00', '10:30',
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00'
]

// ─── Form State ────────────────────────────────────────────────────────────────
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
watch(
  () => state.target_date,
  async (date) => {
    if (!date) return
    state.dock_id = undefined
    state.vehicle_id = undefined
    await Promise.all([
      store.fetchDropdownDocks({ date }),
      store.fetchDropdownVehicles({ date }),
    ])
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
                    <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                    <template #content>
                      <UCalendar v-model="targetDateModel" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
            </UFormField>

            <!-- Target Time -->
            <UFormField label="Waktu Kedatangan (Opsional)" name="target_time">
              <USelectMenu
                v-model="state.target_time"
                :items="timeOptions"
                class="w-full"
                placeholder="Pilih jam kedatangan"
              />
            </UFormField>

            <!-- Receiving Dock -->
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
                  </div>
                </template>
                <template #empty>
                  <p class="text-xs text-muted p-2">
                    {{ !state.target_date ? 'Isi tanggal dulu untuk melihat dock tersedia' : 'Tidak ada dock tersedia' }}
                  </p>
                </template>
              </USelectMenu>
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
          <div class="flex flex-col h-full border border-default rounded-xl overflow-hidden bg-elevated/20">
            <div class="p-3 bg-elevated border-b border-default shrink-0 flex items-center justify-between">
              <h4 class="text-sm font-bold text-default flex items-center gap-1.5">
                <UIcon name="i-lucide-package-2" class="text-primary w-4 h-4" />
                <span>Detail Parts (dari MPO)</span>
              </h4>
              <UBadge color="primary" variant="subtle" size="xs" class="rounded-full">
                {{ state.details.filter(d => d.selected).length }} / {{ state.details.length }} dipilih
              </UBadge>
            </div>

            <!-- Empty: no MPO selected -->
            <div v-if="!state.mpo_id" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <UIcon name="i-lucide-file-search" class="w-10 h-10 text-muted mb-3 opacity-40" />
              <p class="text-xs text-muted font-medium">Pilih MPO terlebih dahulu</p>
              <p class="text-[10px] text-muted/70 mt-1">Parts dari MPO yang dipilih akan muncul di sini.</p>
            </div>

            <!-- Empty: MPO has no remaining parts -->
            <div v-else-if="state.details.length === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <UIcon name="i-lucide-check-circle" class="w-10 h-10 text-success-500 mb-3 opacity-70" />
              <p class="text-xs text-muted font-medium">Semua parts sudah terpenuhi</p>
              <p class="text-[10px] text-muted/70 mt-1">Tidak ada remaining qty pada MPO ini.</p>
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
                      <p class="text-xs font-bold text-default truncate">{{ detail.label }}</p>
                      <p class="text-[10px] text-muted mt-0.5">Maks: {{ detail.max_qty }} pcs</p>

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
        </div>
      </UForm>
    </template>

    <template #footer>
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
          :disabled="props.loading"
          @click="submitForm('draft')"
        />
        <UButton
          color="primary"
          label="Jadwalkan (Scheduled)"
          icon="i-lucide-calendar-check"
          :loading="props.loading && state.save_as === 'scheduled'"
          :disabled="props.loading"
          @click="submitForm('scheduled')"
        />
      </div>
    </template>
  </UModal>
</template>