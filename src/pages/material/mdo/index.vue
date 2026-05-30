<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, computed, watch } from 'vue'
import { CalendarDate } from '@internationalized/date'
import { useMdoStore } from '../../../stores/material/mdo.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'
import MdoAddModal from './components/MdoAddModal.vue'
import MdoDetailPanel from './components/MdoDetailPanel.vue'

const store = useMdoStore()
const { loading, orders, meta } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Material' },
  { label: 'Delivery Order (MDO)' }
]

// Modal & Panel state
const openAddModal = ref(false)
const selectedOrderId = ref<number | null>(null)
const createLoading = ref(false)

const selectedOrder = computed(() => store.detail)

// Filter params
const selectedWarehouseId = ref<number | null>(null)

function getLocalDateString(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Default: hari ini sampai H+7 (7 hari ke depan)
const selectedDateStart = ref(getLocalDateString(0))
const selectedDateEnd   = ref(getLocalDateString(7))

// Model untuk picker tanggal mulai
const selectedDateStartModel = computed({
  get() {
    if (!selectedDateStart.value) return null
    const [y, m, d] = selectedDateStart.value.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) { selectedDateStart.value = ''; return }
    selectedDateStart.value = `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
  }
})

// Model untuk picker tanggal akhir
const selectedDateEndModel = computed({
  get() {
    if (!selectedDateEnd.value) return null
    const [y, m, d] = selectedDateEnd.value.split('-').map(Number)
    return new CalendarDate(y, m, d)
  },
  set(val: CalendarDate | null) {
    if (!val) { selectedDateEnd.value = ''; return }
    selectedDateEnd.value = `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
  }
})

// Shortcut: reset ke "hari ini s/d H+7"
function resetToWeekAhead() {
  selectedDateStart.value = getLocalDateString(0)
  selectedDateEnd.value   = getLocalDateString(7)
}

// selectedDate tetap dipertahankan untuk kompatibilitas timeline yang menampilkan
// 1 tanggal aktif — default-nya adalah tanggal awal range.
const selectedDate = computed(() => selectedDateStart.value)

async function loadOrders() {
  const params: Record<string, any> = { page: 1, limit: 200 }
  // Gunakan range 7 hari ke depan agar tim gudang bisa melihat jadwal lebih awal
  if (selectedDateStart.value) params.start_date = selectedDateStart.value
  if (selectedDateEnd.value)   params.end_date   = selectedDateEnd.value
  await store.fetchMdoList(params)
}

watch([selectedDateStart, selectedDateEnd, selectedWarehouseId], () => { loadOrders() })

onMounted(async () => {
  await store.fetchDropdownWarehouses()
  await loadOrders()
  if (store.warehouses.length > 0) {
    selectedWarehouseId.value = store.warehouses[0].id
  }
})

// Master-detail handler
async function selectOrder(id: number) {
  selectedOrderId.value = id
  try {
    await store.fetchMdoById(id)
  } catch (e) {
    console.error('Failed to load MDO details', e)
  }
}

// Save (create) handler
async function handleSaveOrder(payload: any) {
  createLoading.value = true
  try {
    const res = await store.createMdo(payload)
    if (res.status) {
      openAddModal.value = false
      await loadOrders()
      alert(`MDO berhasil dibuat: ${res.data?.number}`)
    } else {
      alert(res.message || 'Gagal membuat MDO.')
    }
  } catch (e: any) {
    alert(`Gagal: ${e.response?.data?.message || 'Terjadi kesalahan saat menyimpan.'}`)
  } finally {
    createLoading.value = false
  }
}

// Delete handler
async function handleDeleteOrder(id: number) {
  if (!confirm('Yakin ingin menghapus MDO ini? Tindakan ini tidak bisa dibatalkan.')) return
  try {
    const res = await store.deleteMdo(id)
    if (res.status) {
      selectedOrderId.value = null
      store.detail = null
      await loadOrders()
      alert('MDO berhasil dihapus.')
    } else {
      alert(res.message || 'Gagal menghapus MDO.')
    }
  } catch (e: any) {
    alert(`Gagal: ${e.response?.data?.message || e.message}`)
  }
}

// ─── Timeline Helpers ──────────────────────────────────────────────────────────
// MDO uses target_time (single point), displayed as a block spanning ~1hr on timeline
const hoursList = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

const activeWarehouse = computed(() => store.warehouses.find(w => w.id === selectedWarehouseId.value))

// Docks are fetched dynamically - for the timeline view we use the list from the already-loaded orders
const activeDockIdsForDate = computed(() => {
  const ids = new Set<number>()
  activeOrdersForDate.value.forEach(o => { if (o.dock_id) ids.add(o.dock_id) })
  return ids
})

const activeOrdersForDate = computed(() => {
  // Tampilkan semua MDO dalam range start–end (bukan hanya 1 hari)
  return orders.value.filter(o => {
    const oDate = (o.target_date || '').split('T')[0]
    return oDate >= selectedDateStart.value && oDate <= selectedDateEnd.value
  })
})

// Build virtual dock list from fetched orders for the timeline
const timelineDocks = computed(() => {
  const dockMap = new Map<number, { id: number; name: string }>()
  activeOrdersForDate.value.forEach(o => {
    if (o.dock_id && o.dock) dockMap.set(o.dock_id, { id: o.dock_id, name: o.dock.name })
  })
  return Array.from(dockMap.values())
})

function parseTimeToDecimal(timeStr: string | null | undefined): number {
  if (!timeStr) return 8
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1] || '0', 10)
  return hours + minutes / 60
}

// MDO uses single target_time — render as a 30-minute block on the timeline.
// Slot interval backend = 30 menit (0.5 jam), bukan 1 jam — agar 07:00 dan 07:30
// tidak dianggap konflik satu sama lain.
const MDO_DURATION_HOURS = 0.5

function getOrderStyle(order: any) {
  const start = parseTimeToDecimal(order.target_time)
  const end = Math.min(18, start + MDO_DURATION_HOURS)
  const leftHour = Math.max(8, Math.min(18, start))
  const rightHour = Math.max(8, Math.min(18, end))
  const leftPct = ((leftHour - 8) / 10) * 100
  const widthPct = ((rightHour - leftHour) / 10) * 100
  return { left: `${leftPct}%`, width: `${Math.max(widthPct, 4)}%` }
}

// Detect overlapping MDOs on same dock+date.
// Gunakan MDO_DURATION_HOURS (0.5) — konsisten dengan slot 30 menit backend.
function hasOverlapConflict(order: any): boolean {
  const list = activeOrdersForDate.value.filter(o => o.id !== order.id && o.dock_id === order.dock_id)
  const pStart = parseTimeToDecimal(order.target_time)
  const pEnd = pStart + MDO_DURATION_HOURS
  return list.some(other => {
    const oStart = parseTimeToDecimal(other.target_time)
    const oEnd = oStart + MDO_DURATION_HOURS
    return oStart < pEnd && oEnd > pStart
  })
}

const conflictingDocksNames = computed(() => {
  const conflicted = new Set<string>()
  activeOrdersForDate.value.forEach(o => {
    if (hasOverlapConflict(o) && o.dock) conflicted.add(o.dock.name)
  })
  return Array.from(conflicted)
})

const statusColor = (status: string) => {
  if (status === 'draft') return 'warning'
  if (status === 'scheduled') return 'primary'
  if (status === 'in_transit') return 'info'
  if (status === 'arrived') return 'success'
  return 'neutral'
}

const statusLabel = (status: string) => {
  if (status === 'draft') return 'Draft'
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'in_transit') return 'In Transit'
  if (status === 'arrived') return 'Arrived'
  return status
}

// ─── Capacity helpers (untuk card timeline & list) ────────────────────────────
function capacityBarColor(pct: number | null | undefined): string {
  if (pct == null) return 'bg-muted/40'
  if (pct > 90) return 'bg-error-500'
  if (pct > 70) return 'bg-warning-500'
  return 'bg-success-500'
}

function capacityBarWidth(pct: number | null | undefined): string {
  if (pct == null) return '0%'
  return `${Math.min(100, Math.round(pct))}%`
}
</script>

<template>
  <div class="flex flex-col h-full bg-elevated/10">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0 bg-elevated/40">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-truck" class="text-primary w-7 h-7 shrink-0" />
            Material Delivery Order (MDO)
          </h1>
          <p class="text-xs text-muted mt-0.5">
            Jadwalkan kedatangan pengiriman dari supplier ke receiving dock gudang material.
          </p>
        </div>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="solid"
          label="Buat MDO Baru"
          @click="openAddModal = true"
        />
      </div>
    </div>

    <!-- Active State & Visual Shell -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Timeline Workspace -->
      <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        <!-- Filter Bar -->
        <div class="bg-elevated rounded-2xl p-4 border border-default flex flex-wrap gap-4 items-center justify-between shrink-0 shadow-sm">
          <div class="flex flex-wrap items-center gap-4">
            <!-- Warehouse filter -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">Gudang:</span>
              <USelectMenu
                v-model="selectedWarehouseId"
                :items="store.warehouses"
                value-key="id"
                label-key="name"
                class="w-64"
                placeholder="Pilih Gudang"
              />
            </div>
            <!-- Date Range filter: Hari Ini s/d H+7 -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">Jadwal:</span>
              <UInputDate v-model="selectedDateStartModel" class="w-40">
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
                      <UCalendar v-model="selectedDateStartModel" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <span class="text-xs text-muted font-semibold shrink-0">s/d</span>
              <UInputDate v-model="selectedDateEndModel" class="w-40">
                <template #trailing>
                  <UPopover>
                    <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" class="px-0" />
                    <template #content>
                      <UCalendar v-model="selectedDateEndModel" class="p-2" />
                    </template>
                  </UPopover>
                </template>
              </UInputDate>
              <!-- Shortcut reset ke 7 hari ke depan -->
              <UButton
                size="xs"
                color="neutral"
                variant="soft"
                icon="i-lucide-refresh-ccw"
                label="7 Hari"
                @click="resetToWeekAhead"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
              WIB Timezone
            </span>
          </div>
        </div>

        <!-- Conflict Banner -->
        <div
          v-if="conflictingDocksNames.length > 0"
          class="bg-error-500/10 border border-error-500/30 text-error-700 dark:text-error-300 px-4 py-3 rounded-2xl flex items-start gap-2.5 shrink-0 shadow-sm"
        >
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 shrink-0 text-error-500 mt-0.5" />
          <div>
            <h5 class="text-xs font-bold uppercase tracking-wider">
              Konflik Slot Dock Terdeteksi!
            </h5>
            <p class="text-xs mt-0.5 leading-relaxed">
              Terdapat MDO yang saling tumpang tindih pada Dock:
              <span class="font-bold font-mono">{{ conflictingDocksNames.join(', ') }}</span>.
              Blok yang konflik ditampilkan berkedip merah di bawah.
            </p>
          </div>
        </div>

        <!-- Timeline Grid Board -->
        <div class="flex-1 bg-elevated border border-default rounded-3xl p-6 flex flex-col min-w-[700px] shadow-sm relative overflow-hidden">
          <!-- Loading Overlay -->
          <div v-if="loading && orders.length === 0" class="absolute inset-0 bg-elevated/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
          </div>

          <!-- Empty State: no orders for this date -->
          <div v-else-if="timelineDocks.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-center gap-3">
            <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted mb-2 shadow-inner">
              <UIcon name="i-lucide-package-open" class="w-8 h-8 text-default" />
            </div>
            <div>
              <h3 class="font-bold text-default text-lg">
                Belum Ada MDO
              </h3>
              <p class="text-xs text-muted mt-1">
                Tidak ada delivery order yang dijadwalkan untuk tanggal ini.
              </p>
            </div>
          </div>

          <!-- Gantt Timeline -->
          <div v-else class="flex-1 flex flex-col h-full overflow-x-auto select-none">
            <!-- X-Axis Hours Header -->
            <div class="flex border-b border-default/70 pb-3 shrink-0 font-bold uppercase tracking-wider text-[10px] text-muted">
              <div class="w-48 shrink-0 flex items-center">
                <span>Receiving Docks ({{ activeWarehouse?.name || 'Semua Gudang' }})</span>
              </div>
              <div class="flex-1 grid grid-cols-10 text-center relative pr-4">
                <div
                  v-for="hour in hoursList.slice(0, 10)"
                  :key="hour"
                  class="border-l border-default/30 first:border-0 py-0.5 text-center"
                >
                  {{ hour }}
                </div>
                <div class="absolute right-0 top-0 bottom-0 text-[10px] font-bold text-muted -mr-2 select-none pointer-events-none">
                  18:00
                </div>
              </div>
            </div>

            <!-- Timeline Rows (Y-Axis: one row per dock) -->
            <div class="flex-1 divide-y divide-default/40 overflow-y-auto mt-2">
              <div
                v-for="dock in timelineDocks"
                :key="dock.id"
                class="flex items-center min-h-[90px] group transition-all"
              >
                <!-- Dock Label -->
                <div class="w-48 shrink-0 pr-4 flex flex-col justify-center">
                  <span class="text-sm font-bold text-default group-hover:text-primary transition-colors">
                    {{ dock.name }}
                  </span>
                  <span class="text-[10px] font-medium text-muted mt-0.5">
                    Receiving Dock
                  </span>
                </div>

                <!-- Timeline Bar Row -->
                <div class="flex-1 h-full py-3 relative min-h-[64px]">
                  <!-- Background grid lines -->
                  <div class="grid grid-cols-10 h-full w-full absolute top-0 left-0 pointer-events-none z-0 pr-4">
                    <div v-for="idx in 10" :key="idx" class="border-l border-dashed border-default/20 h-full" />
                  </div>

                  <!-- Order blocks -->
                  <div class="w-full h-full relative z-10 pr-4">
                    <div
                      v-for="order in activeOrdersForDate.filter(o => o.dock_id === dock.id)"
                      :key="order.id"
                      class="absolute top-1/2 -translate-y-1/2 rounded-2xl p-3 flex flex-col justify-center min-h-[58px] cursor-pointer transition-all border shadow-sm select-none hover:shadow-md hover:brightness-105 active:scale-[0.98] group/item overflow-hidden"
                      :style="getOrderStyle(order)"
                      :class="[
                        selectedOrderId === order.id
                          ? 'border-primary bg-primary/10 text-primary-800 dark:text-primary-200 font-bold'
                          : hasOverlapConflict(order)
                            ? 'border-error-500 bg-error-500/10 text-error-800 dark:text-error-300 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse'
                            : 'border-default bg-elevated/90 hover:border-muted-foreground/30 text-default'
                      ]"
                      @click="selectOrder(order.id)"
                    >
                      <div class="flex items-center justify-between gap-1 min-w-0">
                        <span class="text-[9px] font-mono font-bold tracking-tight uppercase truncate">
                          {{ order.number }}
                        </span>
                        <UBadge
                          :color="statusColor(order.status)"
                          variant="subtle"
                          size="xs"
                          class="rounded-full shrink-0 text-[8px]"
                        >
                          {{ statusLabel(order.status) }}
                        </UBadge>
                      </div>

                      <h4 class="text-[11px] font-bold leading-tight mt-1 truncate">
                        MPO: {{ order.mpo?.number || '-' }}
                      </h4>

                      <div v-if="order.target_time" class="flex items-center gap-0.5 text-[9px] text-muted mt-0.5">
                        <UIcon name="i-lucide-clock" class="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{{ (order.target_time || '').slice(0, 5) }}</span>
                      </div>

                      <!-- Capacity mini-bar -->
                      <div v-if="order.capacity_usage_pct != null" class="mt-1.5">
                        <div class="flex justify-between items-center mb-0.5">
                          <span class="text-[8px] text-muted leading-none">Muatan</span>
                          <span
                            class="text-[8px] font-bold leading-none"
                            :class="order.capacity_usage_pct > 90 ? 'text-error-500' : order.capacity_usage_pct > 70 ? 'text-warning-500' : 'text-success-500'"
                          >
                            {{ Math.round(order.capacity_usage_pct) }}%
                          </span>
                        </div>
                        <div class="w-full bg-default/60 rounded-full h-1 overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-300"
                            :class="capacityBarColor(order.capacity_usage_pct)"
                            :style="{ width: capacityBarWidth(order.capacity_usage_pct) }"
                          />
                        </div>
                      </div>

                      <!-- Conflict badge -->
                      <div v-if="hasOverlapConflict(order)" class="absolute bottom-1 right-2 flex items-center gap-0.5 text-[8px] font-black uppercase text-error-500 animate-bounce tracking-wide shrink-0">
                        <UIcon name="i-lucide-alert-circle" class="w-2.5 h-2.5 shrink-0" />
                        <span>Conflict</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="border-t border-default/70 pt-4 flex flex-wrap gap-4 items-center justify-end text-[10px] text-muted font-semibold mt-4">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-elevated border border-default" />
                <span>Normal</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-primary/10 border border-primary" />
                <span>Dipilih</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-error-500/10 border border-error-500 animate-pulse" />
                <span>Konflik</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Paginated List below timeline for overflow dates -->
        <div v-if="orders.length > 0" class="bg-elevated border border-default rounded-2xl overflow-hidden shadow-sm">
          <div class="p-4 border-b border-default flex items-center justify-between">
            <h4 class="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <UIcon name="i-lucide-list" class="w-4 h-4" />
              Semua MDO — {{ selectedDateStart }} s/d {{ selectedDateEnd }}
            </h4>
            <span class="text-xs text-muted">Total: {{ meta.total }}</span>
          </div>
          <div class="divide-y divide-default">
            <div
              v-for="order in orders"
              :key="order.id"
              class="px-4 py-3 flex items-center justify-between hover:bg-elevated/40 cursor-pointer transition-colors"
              :class="selectedOrderId === order.id ? 'bg-primary/5' : ''"
              @click="selectOrder(order.id)"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-package" class="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p class="text-xs font-black text-default font-mono">
                    {{ order.number }}
                  </p>
                  <p class="text-[10px] text-muted mt-0.5">
                    MPO: {{ order.mpo?.number || '-' }} · Dock: {{ order.dock?.name || '-' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="order.target_time" class="text-[10px] font-semibold text-muted">
                  {{ (order.target_time || '').slice(0, 5) }}
                </span>
                <!-- Capacity badge in list -->
                <div
                  v-if="order.capacity_usage_pct != null"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                  :class="order.capacity_usage_pct > 90
                    ? 'bg-error-500/10 text-error-600 dark:text-error-400'
                    : order.capacity_usage_pct > 70
                      ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400'
                      : 'bg-success-500/10 text-success-600 dark:text-success-400'"
                >
                  <UIcon name="i-lucide-weight" class="w-2.5 h-2.5 shrink-0" />
                  <span>{{ Math.round(order.capacity_usage_pct) }}%</span>
                </div>
                <UBadge :color="statusColor(order.status)" variant="subtle" size="xs" class="rounded-full text-[10px]">
                  {{ statusLabel(order.status) }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Master-Detail Panel -->
      <div v-if="selectedOrderId" class="w-[400px] shrink-0 border-l border-default bg-elevated/40 h-full">
        <MdoDetailPanel
          :order="selectedOrder"
          :loading="loading"
          @close="selectedOrderId = null; store.detail = null"
          @delete="handleDeleteOrder"
          @refresh="loadOrders(); selectOrder(selectedOrderId!)"
        />
      </div>
    </div>

    <!-- Add Modal -->
    <MdoAddModal
      v-model:open="openAddModal"
      :loading="createLoading"
      @save="handleSaveOrder"
    />
  </div>
</template>