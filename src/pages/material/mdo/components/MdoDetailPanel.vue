<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ref, watch, reactive } from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import type { Mdo } from '../../../../types/material/mdo'
import { useMdoStore } from '../../../../stores/material/mdo.store'

const props = defineProps<{
  order: Mdo | null
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  delete: [id: number]
  refresh: []
}>()

const store = useMdoStore()

// ─── Edit mode ────────────────────────────────────────────────────────────────
const isEditing = ref(false)
const isSaving = ref(false)
const isAdvancing = ref(false)

const editFormRef = ref()
const editState = reactive({
  target_date: '',
  target_time: '' as string | undefined,
  dock_id: undefined as number | undefined,
  vehicle_id: undefined as number | undefined,
  transporter: '' as string | undefined,
  description: '' as string | undefined,
  remarks: '' as string | undefined,
  save_as: 'draft' as 'draft' | 'scheduled',
  details: [] as { part_id: number; qty: number; notes?: string | null; label: string; max_qty: number }[]
})

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

const editSchema = z.object({
  target_date: z.string().min(1, 'Tanggal harus diisi'),
})

// ─── CalendarDate bridge ───────────────────────────────────────────────────────
const editTargetDateModel = computed({
  get() {
    if (!editState.target_date) return null
    const [y, m, d] = editState.target_date.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) { editState.target_date = ''; return }
    editState.target_date = `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
  }
})

// ─── Derived: detail parts from order ─────────────────────────────────────────
const orderDetails = computed(() => props.order?.mdo_details || [])

// ─── Status helpers ────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  if (s === 'draft') return 'warning'
  if (s === 'scheduled') return 'primary'
  if (s === 'in_transit') return 'info'
  if (s === 'arrived') return 'success'
  return 'neutral'
}

const statusLabel = (s: string) => {
  if (s === 'draft') return 'Draft'
  if (s === 'scheduled') return 'Scheduled'
  if (s === 'in_transit') return 'In Transit'
  if (s === 'arrived') return 'Arrived'
  return s
}

const nextStatusLabel = computed(() => {
  if (!props.order) return ''
  if (props.order.status === 'scheduled') return 'Tandai In Transit'
  if (props.order.status === 'in_transit') return 'Tandai Arrived'
  return ''
})

const canEdit = computed(() => props.order?.status === 'draft')
const canDelete = computed(() => props.order?.status === 'draft')
const canAdvance = computed(() =>
  props.order?.status === 'scheduled' || props.order?.status === 'in_transit'
)

// ─── Capacity bar ──────────────────────────────────────────────────────────────
const capacityPct = computed(() => {
  const pct = props.order?.capacity_usage_pct
  if (pct == null) return null
  return Math.min(100, Math.round(pct))
})

const capacityColor = computed(() => {
  if (capacityPct.value == null) return 'bg-muted'
  if (capacityPct.value > 90) return 'bg-error-500'
  if (capacityPct.value > 70) return 'bg-warning-500'
  return 'bg-success-500'
})

// ─── Load dropdowns for editing when date changes ─────────────────────────────
watch(
  () => editState.target_date,
  async (date) => {
    if (!date || !isEditing.value) return
    editState.dock_id = undefined
    editState.vehicle_id = undefined
    await Promise.all([
      store.fetchDropdownDocks({ date, exclude_id: props.order?.id }),
      store.fetchDropdownVehicles({ date, exclude_id: props.order?.id }),
    ])
  }
)

// ─── Start editing: populate editState from current order ─────────────────────
async function startEdit() {
  if (!props.order) return
  const o = props.order
  editState.target_date = (o.target_date || '').split('T')[0]
  editState.target_time = o.target_time ? o.target_time.slice(0, 5) : undefined
  editState.dock_id = o.dock_id ?? undefined
  editState.vehicle_id = o.vehicle_id ?? undefined
  editState.transporter = o.transporter || ''
  editState.description = o.description || ''
  editState.remarks = o.remarks || ''
  editState.save_as = 'draft'
  editState.details = (o.mdo_details || []).map(d => ({
    part_id: d.part_id,
    qty: d.qty,
    notes: d.notes,
    label: d.part ? `${d.part.part_name} (${d.part.part_number})` : `Part #${d.part_id}`,
    max_qty: d.qty, // keep current qty as reference; user can adjust
  }))

  // Load dropdowns for current date
  if (editState.target_date) {
    await Promise.all([
      store.fetchDropdownDocks({ date: editState.target_date, exclude_id: o.id }),
      store.fetchDropdownVehicles({ date: editState.target_date, exclude_id: o.id }),
    ])
  }

  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

// ─── Computed: selected dock & vehicle for edit form ──────────────────────────
const editSelectedDock = computed({
  get: () => store.docks.find(d => d.id === editState.dock_id),
  set: (val: any) => { editState.dock_id = val?.id }
})

const editSelectedVehicle = computed({
  get: () => store.vehicles.find(v => v.id === editState.vehicle_id),
  set: (val: any) => { editState.vehicle_id = val?.id }
})

const vehicleLabel = (v: any) =>
  v ? `${v.plate_number} — ${v.vehicle_type?.name || ''} (${v.vehicle_type?.load_capacity ?? '-'} kg)` : ''

// ─── Save edit ────────────────────────────────────────────────────────────────
function submitEdit(saveAs: 'draft' | 'scheduled') {
  editState.save_as = saveAs
  editFormRef.value?.submit()
}

async function onEditSubmit(_event: FormSubmitEvent<any>) {
  if (!props.order) return
  isSaving.value = true
  try {
    const payload: any = {
      target_date: editState.target_date,
      target_time: editState.target_time ? `${editState.target_time}:00` : null,
      dock_id: editState.dock_id ?? null,
      vehicle_id: editState.vehicle_id ?? null,
      transporter: editState.transporter || null,
      description: editState.description || null,
      remarks: editState.remarks || null,
      save_as: editState.save_as,
      details: editState.details.map(d => ({
        part_id: d.part_id,
        qty: Number(d.qty),
        notes: d.notes || null,
      }))
    }
    const res = await store.updateMdo(props.order.id, payload)
    if (res?.status) {
      isEditing.value = false
      emit('refresh')
    } else {
      alert(res?.message || 'Gagal menyimpan perubahan.')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || 'Terjadi kesalahan saat menyimpan.')
  } finally {
    isSaving.value = false
  }
}

// ─── Advance status ────────────────────────────────────────────────────────────
async function handleAdvanceStatus() {
  if (!props.order) return
  const label = nextStatusLabel.value
  if (!confirm(`Yakin ingin ${label}?`)) return
  isAdvancing.value = true
  try {
    const res = await store.advanceMdoStatus(props.order.id)
    if (res?.status) {
      emit('refresh')
    } else {
      alert(res?.message || 'Gagal mengubah status.')
    }
  } catch (e: any) {
    alert(e.response?.data?.message || 'Terjadi kesalahan.')
  } finally {
    isAdvancing.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-elevated border-l border-default shadow-2xl relative overflow-hidden">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="p-4 border-b border-default shrink-0 flex items-center justify-between bg-elevated/40">
      <div class="flex items-center gap-2">
        <div class="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
          <UIcon name="i-lucide-truck" class="w-4 h-4" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-default">Detail MDO</h3>
          <p class="text-[10px] text-muted">{{ props.order?.number || 'Pilih MDO' }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <!-- Edit trigger (only draft) -->
        <UButton
          v-if="canEdit && !isEditing"
          color="neutral"
          variant="ghost"
          icon="i-lucide-pencil"
          size="sm"
          class="rounded-full"
          title="Edit MDO"
          @click="startEdit"
        />
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          class="rounded-full"
          @click="emit('close')"
        />
      </div>
    </div>

    <!-- ── Loading skeleton ────────────────────────────────────────────────── -->
    <div v-if="props.loading && !props.order" class="flex-1 flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- ── Empty selection ─────────────────────────────────────────────────── -->
    <div v-else-if="!props.order" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div class="w-12 h-12 bg-default rounded-full flex items-center justify-center mb-4 opacity-40 shadow-inner">
        <UIcon name="i-lucide-package-open" class="w-6 h-6 text-muted" />
      </div>
      <h3 class="text-sm font-bold text-default">Tidak Ada MDO Dipilih</h3>
      <p class="text-[10px] text-muted mt-1">Klik blok di timeline atau item di list untuk melihat detailnya.</p>
    </div>

    <!-- ── EDIT MODE ───────────────────────────────────────────────────────── -->
    <div v-else-if="isEditing" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="flex items-center gap-2 mb-2">
        <UIcon name="i-lucide-pencil" class="w-4 h-4 text-warning-500" />
        <span class="text-xs font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider">Mode Edit</span>
      </div>

      <UForm
        ref="editFormRef"
        :schema="editSchema"
        :state="editState"
        class="space-y-4"
        @submit="onEditSubmit"
      >
        <!-- Target Date -->
        <UFormField label="Tanggal Pengiriman" name="target_date" required>
          <UInputDate v-model="editTargetDateModel" class="w-full">
            <template #trailing>
              <UPopover>
                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                <template #content>
                  <UCalendar v-model="editTargetDateModel" class="p-2" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <!-- Target Time -->
        <UFormField label="Waktu Kedatangan (Opsional)" name="target_time">
          <USelectMenu
            v-model="editState.target_time"
            :items="timeOptions"
            class="w-full"
            placeholder="Pilih jam kedatangan"
          />
        </UFormField>

        <!-- Dock -->
        <UFormField label="Receiving Dock" name="dock_id">
          <USelectMenu
            v-model="editSelectedDock"
            :items="store.docks"
            class="w-full"
            placeholder="Pilih dock"
            label-key="name"
            :disabled="!editState.target_date"
          >
            <template #option="{ item }">
              <div class="flex flex-col py-0.5">
                <span class="font-bold text-xs">{{ item.name }}</span>
                <span v-if="item.area" class="text-[10px] text-muted">{{ item.area.name }}</span>
              </div>
            </template>
          </USelectMenu>
        </UFormField>

        <!-- Vehicle -->
        <UFormField label="Kendaraan" name="vehicle_id">
          <USelectMenu
            v-model="editSelectedVehicle"
            :items="store.vehicles"
            class="w-full"
            placeholder="Pilih kendaraan"
            label-key="plate_number"
            searchable
            :search-attributes="['plate_number', 'vehicle_code']"
            :disabled="!editState.target_date"
          >
            <template #label>
              <span v-if="editSelectedVehicle" class="text-xs">{{ vehicleLabel(editSelectedVehicle) }}</span>
              <span v-else class="text-muted text-xs">Pilih kendaraan</span>
            </template>
            <template #option="{ item }">
              <div class="flex flex-col py-0.5">
                <span class="font-bold text-xs font-mono">{{ item.plate_number }}</span>
                <span class="text-[10px] text-muted">{{ item.vehicle_code }} · {{ item.vehicle_type?.name }} · {{ item.vehicle_type?.load_capacity ?? '-' }} kg</span>
              </div>
            </template>
          </USelectMenu>
        </UFormField>

        <!-- Transporter -->
        <UFormField label="Transporter / Ekspedisi" name="transporter">
          <UInput v-model="editState.transporter" placeholder="Nama ekspedisi atau sopir" class="w-full" />
        </UFormField>

        <!-- Description -->
        <UFormField label="Deskripsi" name="description">
          <UTextarea v-model="editState.description" :rows="2" class="w-full" />
        </UFormField>

        <!-- Remarks -->
        <UFormField label="Catatan / Remarks" name="remarks">
          <UTextarea v-model="editState.remarks" :rows="2" class="w-full" />
        </UFormField>

        <!-- Part details edit -->
        <div>
          <h5 class="text-xs font-bold text-muted uppercase tracking-wider mb-2">Detail Parts</h5>
          <div class="border border-default rounded-xl overflow-hidden divide-y divide-default">
            <div
              v-for="(detail, idx) in editState.details"
              :key="detail.part_id"
              class="p-3 bg-elevated/20"
            >
              <p class="text-xs font-bold text-default truncate">{{ detail.label }}</p>
              <div class="flex gap-2 mt-2">
                <UInput
                  v-model="editState.details[idx].qty"
                  type="number"
                  min="1"
                  size="sm"
                  placeholder="Qty"
                  class="w-24"
                />
                <UInput
                  v-model="editState.details[idx].notes"
                  placeholder="Catatan part (opsional)"
                  size="sm"
                  class="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </UForm>

      <!-- Edit Actions -->
      <div class="pt-4 border-t border-default flex flex-col gap-2 sticky bottom-0 bg-elevated pb-2">
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Batal"
            class="flex-1"
            :disabled="isSaving"
            @click="cancelEdit"
          />
          <UButton
            color="warning"
            variant="soft"
            label="Simpan Draft"
            icon="i-lucide-save"
            class="flex-1"
            :loading="isSaving && editState.save_as === 'draft'"
            :disabled="isSaving"
            @click="submitEdit('draft')"
          />
        </div>
        <UButton
          color="primary"
          label="Simpan & Jadwalkan"
          icon="i-lucide-calendar-check"
          class="w-full font-bold justify-center"
          :loading="isSaving && editState.save_as === 'scheduled'"
          :disabled="isSaving"
          @click="submitEdit('scheduled')"
        />
      </div>
    </div>

    <!-- ── VIEW MODE ───────────────────────────────────────────────────────── -->
    <div v-else class="flex-1 overflow-y-auto p-6 space-y-6">

      <!-- MDO Number Card -->
      <div class="p-5 rounded-2xl border border-default bg-elevated/20 relative overflow-hidden flex flex-col justify-center">
        <div class="absolute -right-16 -bottom-16 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
        <span class="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1">
          Material Delivery Order
        </span>
        <h2 class="text-2xl font-black text-default tracking-tight font-mono">
          {{ props.order.number }}
        </h2>
        <div class="flex items-center gap-2 mt-3 flex-wrap">
          <UBadge
            :color="statusColor(props.order.status)"
            variant="subtle"
            class="rounded-full font-bold px-2 py-0.5 text-[10px]"
          >
            {{ statusLabel(props.order.status) }}
          </UBadge>
          <span class="text-[10px] text-muted">
            Dibuat {{ new Date(props.order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
          </span>
          <span v-if="props.order.warnings?.length" class="text-[10px] text-warning-600 dark:text-warning-400 font-semibold flex items-center gap-0.5">
            <UIcon name="i-lucide-alert-triangle" class="w-3 h-3" />
            {{ props.order.warnings.length }} peringatan
          </span>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="props.order.warnings?.length" class="space-y-2">
        <div
          v-for="(w, i) in props.order.warnings"
          :key="i"
          class="flex items-start gap-2 p-3 rounded-xl bg-warning-500/10 border border-warning-500/20 text-xs text-warning-700 dark:text-warning-300"
        >
          <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 shrink-0 mt-0.5 text-warning-500" />
          <span>{{ w }}</span>
        </div>
      </div>

      <!-- Metadata Grid -->
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-muted uppercase tracking-wider">Informasi Pengiriman</h4>

        <div class="grid grid-cols-2 gap-3">
          <!-- MPO -->
          <div class="p-3 rounded-xl border border-default bg-elevated/40 col-span-2">
            <span class="text-[10px] text-muted font-semibold block mb-1">Purchase Order (MPO)</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-xs">
              <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{{ props.order.mpo?.number || '-' }}</span>
            </div>
            <span v-if="props.order.mpo?.description" class="text-[10px] text-muted/70 mt-0.5 block truncate">
              {{ props.order.mpo.description }}
            </span>
          </div>

          <!-- Target Date -->
          <div class="p-3 rounded-xl border border-default bg-elevated/40">
            <span class="text-[10px] text-muted font-semibold block mb-1">Tanggal</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-xs">
              <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{{ new Date(props.order.target_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) }}</span>
            </div>
          </div>

          <!-- Target Time -->
          <div class="p-3 rounded-xl border border-default bg-elevated/40">
            <span class="text-[10px] text-muted font-semibold block mb-1">Jam Kedatangan</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-xs">
              <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{{ props.order.target_time ? props.order.target_time.slice(0, 5) : 'Tidak ditentukan' }}</span>
            </div>
          </div>

          <!-- Receiving Dock -->
          <div class="p-3 rounded-xl border border-default bg-elevated/40">
            <span class="text-[10px] text-muted font-semibold block mb-1">Receiving Dock</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-xs">
              <UIcon name="i-lucide-navigation" class="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>{{ props.order.dock?.name || '-' }}</span>
            </div>
          </div>

          <!-- Vehicle -->
          <div class="p-3 rounded-xl border border-default bg-elevated/40">
            <span class="text-[10px] text-muted font-semibold block mb-1">Kendaraan</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-xs">
              <UIcon name="i-lucide-truck" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span class="font-mono">{{ props.order.vehicle?.plate_number || '-' }}</span>
            </div>
            <span v-if="props.order.vehicle?.vehicle_type" class="text-[9px] text-muted block mt-0.5">
              {{ props.order.vehicle.vehicle_type.name }} · {{ props.order.vehicle.vehicle_type.load_capacity }} kg
            </span>
          </div>

          <!-- Transporter -->
          <div v-if="props.order.transporter" class="p-3 rounded-xl border border-default bg-elevated/40 col-span-2">
            <span class="text-[10px] text-muted font-semibold block mb-1">Transporter / Ekspedisi</span>
            <div class="flex items-center gap-1.5 font-bold text-default text-xs">
              <UIcon name="i-lucide-package" class="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>{{ props.order.transporter }}</span>
            </div>
          </div>
        </div>

        <!-- Capacity Bar -->
        <div v-if="capacityPct !== null" class="p-3 rounded-xl border border-default bg-elevated/40">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-[10px] text-muted font-semibold">Kapasitas Kendaraan Terpakai</span>
            <span class="text-[10px] font-bold" :class="capacityPct > 90 ? 'text-error-500' : capacityPct > 70 ? 'text-warning-500' : 'text-success-500'">
              {{ capacityPct }}%
            </span>
          </div>
          <div class="w-full bg-default rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="capacityColor"
              :style="{ width: `${capacityPct}%` }"
            />
          </div>
          <div class="flex justify-between text-[9px] text-muted mt-1">
            <span>{{ props.order.total_weight_kg?.toFixed(1) ?? '-' }} kg dipakai</span>
            <span>{{ props.order.vehicle_capacity_kg ?? '-' }} kg kapasitas</span>
          </div>
        </div>

        <!-- Description / Remarks -->
        <div v-if="props.order.description || props.order.remarks" class="space-y-2">
          <div v-if="props.order.description" class="p-3 rounded-xl border border-default bg-elevated/40">
            <span class="text-[10px] text-muted font-semibold block mb-1">Deskripsi</span>
            <p class="text-xs text-default leading-relaxed">{{ props.order.description }}</p>
          </div>
          <div v-if="props.order.remarks" class="p-3 rounded-xl border border-default bg-elevated/40">
            <span class="text-[10px] text-muted font-semibold block mb-1">Catatan / Remarks</span>
            <p class="text-xs text-default leading-relaxed">{{ props.order.remarks }}</p>
          </div>
        </div>

        <!-- Creator -->
        <div class="p-3 rounded-xl border border-default bg-elevated/40">
          <span class="text-[10px] text-muted font-semibold block mb-1">Dibuat Oleh</span>
          <div class="flex items-center gap-1.5 font-bold text-default text-xs">
            <UIcon name="i-lucide-user" class="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>{{ props.order.creator?.user_detail?.full_name || props.order.creator?.email || 'System' }}</span>
          </div>
        </div>
      </div>

      <!-- Parts Detail Table -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-muted uppercase tracking-wider">Detail Parts</h4>
        <div class="border border-default rounded-xl overflow-hidden">
          <div class="divide-y divide-default bg-elevated/20">
            <div v-if="orderDetails.length === 0" class="p-4 text-center text-xs text-muted">
              Tidak ada data parts.
            </div>
            <div
              v-for="detail in orderDetails"
              :key="detail.id"
              class="p-4 hover:bg-elevated/40 transition-colors"
            >
              <div class="flex justify-between items-start gap-3">
                <div class="space-y-0.5 min-w-0">
                  <h5 class="text-xs font-bold text-default truncate">
                    {{ detail.part?.part_name || `Part #${detail.part_id}` }}
                  </h5>
                  <p class="text-[10px] text-muted">
                    No: {{ detail.part?.part_number || '-' }}
                    <span v-if="detail.part?.uom"> · {{ detail.part.uom.name }}</span>
                  </p>
                  <p v-if="detail.notes" class="text-[10px] text-muted/70 italic">{{ detail.notes }}</p>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-[10px] text-muted block">Qty</span>
                  <span class="text-sm font-black text-primary">{{ detail.qty }}</span>
                  <span v-if="detail.part?.weight" class="text-[9px] text-muted block mt-0.5">
                    {{ (detail.qty * detail.part.weight).toFixed(1) }} kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-6 border-t border-default flex flex-col gap-3">
        <!-- Advance status button -->
        <UButton
          v-if="canAdvance"
          color="primary"
          class="w-full font-bold justify-center"
          icon="i-lucide-arrow-right-circle"
          :label="nextStatusLabel"
          :loading="isAdvancing"
          @click="handleAdvanceStatus"
        />

        <!-- Delete (draft only) -->
        <UButton
          v-if="canDelete"
          color="error"
          variant="outline"
          class="w-full font-bold justify-center"
          icon="i-lucide-trash-2"
          label="Hapus MDO"
          @click="emit('delete', props.order!.id)"
        />
      </div>
    </div>
  </div>
</template>