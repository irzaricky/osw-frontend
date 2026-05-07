<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useForecastStore } from '../../../../stores/sales/forecast.store'
import type { Forecast } from '../../../../types/sales/forecast'
import { useAppToast } from '../../../../composables/useAppToast'
import { useAuthStore } from '../../../../stores/auth.store'

const props = defineProps<{
  forecastId: number
  forecastSummary: Forecast | null
}>()

const emit = defineEmits<{
  edit: [forecast: Forecast]
  delete: [id: number]
  refreshList: []
}>()

const store = useForecastStore()
const authStore = useAuthStore()
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Data ────────────────────────────────────────────────────────────────────
const periods = ref<{ date: string; label: string; isCurrent: boolean; isPast: boolean }[]>([])
const parts = ref<{ id: number; part_number: string; part_name: string }[]>([])
const dataEntry = ref<Record<number, Record<string, { forecast_qty: number; qty_status: string; isNew?: boolean }>>>({})
const loadingDetail = ref(false)
const isDirty = ref(false)

// Watch for any changes in dataEntry or parts to set isDirty to true
watch([dataEntry, parts], () => {
  if (!loadingDetail.value) {
    isDirty.value = true
  }
}, { deep: true })

defineExpose({
  isDirty,
  resetDirty: () => { isDirty.value = false }
})

// ─── Part Dropdown ───────────────────────────────────────────────────────────
const selectedNewParts = ref<number[]>([])

const availableParts = computed(() => {
  const existingPartIds = parts.value.map(p => p.id)
  return store.partsDropdown.filter(p => !existingPartIds.includes(p.id))
})

const partItems = computed(() => availableParts.value.map(p => p.part_name))

const selectedPartLabels = computed({
  get: () => {
    return selectedNewParts.value
      .map(id => store.partsDropdown.find(p => p.id === id)?.part_name)
      .filter(Boolean) as string[]
  },
  set: (vals: string[]) => {
    selectedNewParts.value = vals
      .map(name => store.partsDropdown.find(p => p.part_name === name)?.id)
      .filter(Boolean) as number[]
  }
})

// ─── Period Helpers ───────────────────────────────────────────────────────────
function getPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function getAutoQtyStatus(periodDate: string): 'Fix' | 'Temporary' {
  const today = new Date()
  const currentMonthKey = getPeriodKey(today.getFullYear(), today.getMonth() + 1)
  // current month or past → Fix; future → Temporary
  return periodDate <= currentMonthKey ? 'Fix' : 'Temporary'
}

function formatPeriodDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('default', { month: 'short', year: 'numeric' })
}

// Visual: a cell is "empty" if qty is 0 and it's a new cell (not yet saved)
function isCellEmpty(partId: number, periodDate: string): boolean {
  const entry = dataEntry.value[partId]?.[periodDate]
  return !entry || entry.forecast_qty === 0
}

// ─── Computed: filling completeness ──────────────────────────────────────────
const fillStats = computed(() => {
  if (!parts.value.length || !periods.value.length) return { total: 0, filled: 0, pct: 100 }
  let total = 0
  let filled = 0

  parts.value.forEach(part => {
    if (is4Month.value) {
      // 4-Month: Check every period
      periods.value.forEach(period => {
        total++
        const entry = dataEntry.value[part.id]?.[period.date]
        if (entry && entry.forecast_qty > 0) filled++
      })
    } else {
      // Yearly/Half-Year
      total++
      const firstPeriod = periods.value[0]
      const entry = dataEntry.value[part.id]?.[firstPeriod.date]
      if (entry && entry.forecast_qty > 0) filled++
    }
  })
  return { total, filled, pct: total === 0 ? 100 : Math.round((filled / total) * 100) }
})

// ─── Load Detail ─────────────────────────────────────────────────────────────
async function loadDetail() {
  if (!props.forecastId) return
  loadingDetail.value = true
  try {
    const data = await store.fetchForecastById(props.forecastId)
    if (data?.data) {
      setupAdaptableTable(data.data)
    }
  } catch {
    toast.add({ title: 'Error', description: 'Failed to load forecast details', color: 'error' })
  } finally {
    loadingDetail.value = false
    // Ensure isDirty is reset after initial load setup
    setTimeout(() => { isDirty.value = false }, 50)
  }
}

function setupAdaptableTable(forecast: any) {
  periods.value = []
  const today = new Date()
  const currentMonthKey = getPeriodKey(today.getFullYear(), today.getMonth() + 1)

  const start = new Date(forecast.start_period)
  const end = new Date(forecast.end_period)
  let current = new Date(start)

  while (current <= end) {
    const year = current.getFullYear()
    const month = current.getMonth() + 1
    const dateStr = getPeriodKey(year, month)
    const label = current.toLocaleString('default', { month: 'short', year: 'numeric' })
    const isPast = dateStr < currentMonthKey
    const isCurrent = dateStr === currentMonthKey

    periods.value.push({ date: dateStr, label, isCurrent, isPast })
    current.setMonth(current.getMonth() + 1)
  }

  const partsMap = new Map<number, any>()
  dataEntry.value = {}

  if (forecast.details) {
    forecast.details.forEach((d: any) => {
      if (!dataEntry.value[d.part_id]) {
        dataEntry.value[d.part_id] = {}
      }
      dataEntry.value[d.part_id][d.period_date] = {
        forecast_qty: d.forecast_qty,
        qty_status: d.qty_status,
        isNew: false
      }
      if (!partsMap.has(d.part_id) && d.part) {
        partsMap.set(d.part_id, d.part)
      }
    })
  }

  parts.value = Array.from(partsMap.values())
}

// ─── Part Management ─────────────────────────────────────────────────────────
function addNewPart() {
  if (!selectedNewParts.value.length) return

  selectedNewParts.value.forEach(partId => {
    const partToAdd = store.partsDropdown.find(p => p.id === partId)
    if (!partToAdd) return

    if (parts.value.find(p => p.id === partToAdd.id)) return

    parts.value.push(partToAdd)
    dataEntry.value[partToAdd.id] = {}

    // Auto-set qty_status based on period: current/past = Fix, future = Temporary
    if (is4Month.value) {
      periods.value.forEach(p => {
        dataEntry.value[partToAdd.id][p.date] = {
          forecast_qty: 0,
          qty_status: getAutoQtyStatus(p.date),
          isNew: true
        }
      })
    } else if (periods.value.length > 0) {
      const p = periods.value[0]
      dataEntry.value[partToAdd.id][p.date] = {
        forecast_qty: 0,
        qty_status: getAutoQtyStatus(p.date),
        isNew: true
      }
    }
  })
  
  selectedNewParts.value = []
}

function removePart(partId: number) {
  parts.value = parts.value.filter(p => p.id !== partId)
  delete dataEntry.value[partId]
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function saveChanges() {
  const detailsToSave: any[] = []

  parts.value.forEach(part => {
    if (is4Month.value) {
      periods.value.forEach(period => {
        const entry = dataEntry.value[part.id]?.[period.date]
        if (entry) {
          detailsToSave.push({
            part_id: part.id,
            period_date: period.date,
            forecast_qty: entry.forecast_qty || 0
          })
        }
      })
    } else {
      const firstPeriod = periods.value[0]
      const entry = dataEntry.value[part.id]?.[firstPeriod.date]
      if (entry) {
        detailsToSave.push({
          part_id: part.id,
          period_date: firstPeriod.date,
          forecast_qty: entry.forecast_qty || 0
        })
      }
    }
  })

  try {
    await store.updateForecastDetail(props.forecastId, { details: detailsToSave })
    isDirty.value = false // Reset after successful save
    toastSuccess('Forecast details saved successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Review & Submit ─────────────────────────────────────────────────────────
async function submitForecast() {
  try {
    await store.submitForecast(props.forecastId)
    toastSuccess('Forecast submitted successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

const isReviewOpen = ref(false)
const reviewForm = ref({
  status: 'Approved' as 'Approved' | 'Rejected',
  remarks: ''
})

function openReviewModal() {
  reviewForm.value = {
    status: 'Approved',
    remarks: ''
  }
  isReviewOpen.value = true
}

async function confirmReview() {
  if (reviewForm.value.status === 'Rejected' && !reviewForm.value.remarks) {
    toast.add({ title: 'Error', description: 'Remarks is required when rejected', color: 'error' })
    return
  }

  try {
    await store.reviewForecast(props.forecastId, reviewForm.value)
    toastSuccess(`Forecast ${reviewForm.value.status.toLowerCase()} successfully`)
    isReviewOpen.value = false
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

const isSupervisor = computed(() => {
  const role = authStore.user?.role
  return role === 'Superadmin' || role === 'Supervisor Sales Forecast'
})

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    Draft: 'i-lucide-file-edit',
    Submitted: 'i-lucide-send',
    Approved: 'i-lucide-check-circle',
    Rejected: 'i-lucide-x-circle'
  }
  return map[status] || 'i-lucide-circle'
}

function getQtyStatusColor(status: string): any {
  return status === 'Fix' ? 'success' : 'warning'
}

function getLogActionColor(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('approve')) return 'text-success-600 dark:text-success-400'
  if (a.includes('reject')) return 'text-error-600 dark:text-error-400'
  if (a.includes('submit')) return 'text-warning-600 dark:text-warning-400'
  if (a.includes('create')) return 'text-blue-600 dark:text-blue-400'
  if (a.includes('update')) return 'text-primary-600 dark:text-primary-400'
  return 'text-primary'
}

// ─── Forecast type helper ─────────────────────────────────────────────────────
const forecastType = computed(() => store.detail?.forecast_type || '')
const is4Month = computed(() => forecastType.value === '4-Month')
const isEditable = computed(() => store.detail?.status === 'Draft')

const isLogsOpen = ref(false)

async function handleViewLogs() {
  try {
    await store.fetchForecastLogs(props.forecastId)
    isLogsOpen.value = true
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Download Template ────────────────────────────────────────────────────────
async function downloadTemplate() {
  try {
    const blob = await store.downloadTemplateDetail(forecastType.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ForecastTemplate_${forecastType.value}_${Date.now()}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    toastSuccess('Template downloaded')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Upload Template ──────────────────────────────────────────────────────────
const isUploadOpen = ref(false)
const uploadFile = ref<File | null>(null)

async function handleUpload() {
  if (!uploadFile.value) return
  try {
    const res = await store.uploadTemplateDetail(uploadFile.value, forecastType.value)
    toastSuccess(res.message || 'Upload successful')
    isUploadOpen.value = false
    uploadFile.value = null
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
watch(() => props.forecastId, () => {
  loadDetail()
}, { immediate: true })

onMounted(() => {
  store.fetchDropdownParts()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Detail Header -->
    <div class="px-6 py-4 border-b border-default shrink-0">
      <div v-if="loadingDetail" class="flex items-center gap-3">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary" />
        <span class="text-sm text-muted">Loading detail...</span>
      </div>
      <div v-else-if="store.detail" class="space-y-3">
        <!-- Row 1: Title, Status, Fill Indicator -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0">
            <h2 class="text-lg font-bold truncate">{{ store.detail.forecast_number }}</h2>
            <p class="text-sm text-muted">{{ store.detail.customer?.name }}</p>
          </div>
          <div class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm"
            :class="{
              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300': store.detail.status === 'Draft',
              'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300': store.detail.status === 'Submitted',
              'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300': store.detail.status === 'Approved',
              'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300': store.detail.status === 'Rejected',
            }"
          >
            <UIcon :name="getStatusIcon(store.detail.status)" class="w-3.5 h-3.5" />
            {{ store.detail.status }}
          </div>
          <div
            v-if="parts.length > 0"
            class="flex items-center gap-1.5 shrink-0 ml-auto"
            :class="fillStats.pct === 100 ? 'text-success-500' : fillStats.pct >= 50 ? 'text-warning-500' : 'text-error-500'"
          >
            <UIcon
              :name="fillStats.pct === 100 ? 'i-lucide-check-circle-2' : 'i-lucide-alert-circle'"
              class="w-4 h-4"
            />
            <span class="text-xs font-medium">{{ fillStats.filled }}/{{ fillStats.total }} filled</span>
          </div>
        </div>

        <!-- Row 2: Action Buttons -->
        <div class="flex items-center gap-1">
          <!-- Data Actions -->
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Template"
            @click="downloadTemplate"
          />
          <UButton
            icon="i-lucide-upload"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Import"
            @click="isUploadOpen = true"
            :disabled="!isEditable"
          />
          <UButton
            icon="i-lucide-history"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Logs"
            @click="handleViewLogs"
          />

          <div class="w-px h-5 bg-default mx-1" />

          <!-- Document Actions -->
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Edit"
            @click="forecastSummary && emit('edit', forecastSummary)"
            :disabled="!isEditable"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            label="Delete"
            @click="emit('delete', forecastId)"
            :disabled="!isEditable"
          />

          <div class="flex-1" />

          <!-- Primary Actions (right-aligned) -->
          <UButton
            v-if="store.detail.status === 'Draft' && fillStats.pct === 100 && parts.length > 0"
            icon="i-lucide-send"
            color="warning"
            variant="subtle"
            size="sm"
            label="Submit"
            :loading="store.loading"
            @click="submitForecast"
          />
          <UButton
            v-if="store.detail.status === 'Submitted' && isSupervisor"
            icon="i-lucide-check-square"
            color="success"
            variant="subtle"
            size="sm"
            label="Review"
            @click="openReviewModal"
          />
          <UButton
            v-if="store.detail.status === 'Draft'"
            icon="i-lucide-save"
            color="primary"
            size="sm"
            label="Save"
            :loading="store.loading"
            @click="saveChanges"
          />
        </div>
      </div>
    </div>

    <!-- Detail Body -->
    <div class="flex-1 overflow-y-auto p-6 space-y-5">
      <div v-if="loadingDetail" class="flex justify-center p-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <template v-else-if="store.detail">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Forecast Type</div>
            <div class="text-sm font-semibold">{{ store.detail.forecast_type }}</div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Period</div>
            <div class="text-sm font-semibold">
              {{ formatPeriodDate(store.detail.start_period) }} — {{ formatPeriodDate(store.detail.end_period) }}
            </div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Created By</div>
            <div class="text-sm font-semibold">{{ store.detail.staff?.user_detail?.full_name || '-' }}</div>
          </div>
          <div class="bg-elevated/50 rounded-xl border border-default p-3">
            <div class="text-xs text-muted mb-1">Version</div>
            <div class="text-sm font-semibold">{{ store.detail.version || '-' }}</div>
          </div>
        </div>

        <!-- Unfilled warning banner -->
        <div
          v-if="parts.length > 0 && fillStats.pct < 100"
          class="flex items-center gap-3 p-3 rounded-xl border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300"
        >
          <UIcon name="i-lucide-triangle-alert" class="w-4 h-4 shrink-0" />
          <p class="text-sm">
            <span class="font-semibold">{{ fillStats.total - fillStats.filled }} cell(s) not yet filled.</span>
          </p>
        </div>

        <!-- Add Part -->
        <div class="flex items-end gap-2 bg-elevated/30 p-4 rounded-xl border border-default">
          <UFormField label="Add Part to Forecast" class="flex-1 max-w-sm">
            <USelectMenu
              v-model="selectedPartLabels"
              :items="partItems"
              placeholder="Search and select parts..."
              class="w-full"
              clear
              searchable
              multiple
              :disabled="!isEditable"
            />
          </UFormField>
          <UButton
            label="Add"
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            @click="addNewPart"
            :disabled="selectedNewParts.length === 0 || !isEditable"
          />
        </div>

        <!-- Adaptable Table -->
        <!-- 4-Month: show period columns | Yearly/Half-Year: flat Part + Qty table -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <!-- ── 4-Month: per-period columns ── -->
          <table v-if="is4Month" class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default min-w-[200px] sticky left-0 bg-elevated/80 backdrop-blur z-10">Part</th>
                <th
                  v-for="period in periods"
                  :key="period.date"
                  class="p-3 font-medium border-r border-default min-w-[120px] text-center"
                  :class="{
                    'bg-primary/10 text-primary': period.isCurrent,
                    'text-muted': period.isPast
                  }"
                >
                  <div class="flex flex-col items-center gap-0.5">
                    <span>{{ period.label }}</span>
                    <UBadge v-if="period.isCurrent" color="primary" variant="subtle" size="xs">Current</UBadge>
                    <span v-else-if="period.isPast" class="text-xs font-normal opacity-60">Past</span>
                  </div>
                </th>
                <th class="p-3 font-medium w-14 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="parts.length === 0">
                <td :colspan="periods.length + 2" class="p-8 text-center text-muted text-sm">
                  No parts added to this forecast yet.
                </td>
              </tr>
              <tr
                v-for="part in parts"
                :key="part.id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20"
              >
                <td class="p-3 border-r border-default sticky left-0 bg-default z-10">
                  <div class="font-medium">{{ part.part_number }}</div>
                  <div class="text-xs text-muted line-clamp-1">{{ part.part_name }}</div>
                </td>
                <td
                  v-for="period in periods"
                  :key="period.date"
                  class="p-2 border-r border-default align-top transition-colors"
                  :class="{
                    'bg-primary/5': period.isCurrent,
                    'bg-error-300 dark:bg-error-900/70': dataEntry[part.id] && isCellEmpty(part.id, period.date),
                  }"
                >
                  <div v-if="dataEntry[part.id]" class="flex flex-col gap-1.5">
                    {{ (() => {
                        if (!dataEntry[part.id][period.date]) {
                          dataEntry[part.id][period.date] = {
                            forecast_qty: 0,
                            qty_status: getAutoQtyStatus(period.date),
                            isNew: true
                          }
                        }
                        return ''
                    })() }}
                    <UInput
                      type="number"
                      v-model.number="dataEntry[part.id][period.date].forecast_qty"
                      size="sm"
                      placeholder="Qty"
                      min="0"
                      :disabled="!isEditable"
                    />
                    <div class="flex justify-center">
                      <UBadge
                        :color="getQtyStatusColor(dataEntry[part.id][period.date].qty_status)"
                        variant="subtle"
                        size="xs"
                        class="w-full justify-center"
                      >
                        {{ dataEntry[part.id][period.date].qty_status }}
                      </UBadge>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-center">
                  <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" @click="removePart(part.id)" :disabled="!isEditable" />
                </td>
              </tr>
            </tbody>
          </table>

          <!-- ── Yearly / Half-Year: flat Part + Qty table ── -->
          <table v-else class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default min-w-[200px]">Part</th>
                <th class="p-3 font-medium border-r border-default w-40 text-center">Forecast Qty</th>
                <th class="p-3 font-medium border-r border-default w-32 text-center">Status</th>
                <th class="p-3 font-medium w-14 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="parts.length === 0">
                <td colspan="4" class="p-8 text-center text-muted text-sm">
                  No parts added to this forecast yet.
                </td>
              </tr>
              <tr
                v-for="part in parts"
                :key="part.id"
                class="border-b border-default last:border-b-0 hover:bg-elevated/20"
              >
                <td class="p-3 border-r border-default">
                  <div class="font-medium">{{ part.part_number }}</div>
                  <div class="text-xs text-muted line-clamp-1">{{ part.part_name }}</div>
                </td>
                <td
                  class="p-2 border-r border-default text-center"
                  :class="{ 'bg-error-300 dark:bg-error-900/70': dataEntry[part.id] && isCellEmpty(part.id, periods[0]?.date || '') }"
                >
                  <!-- For Yearly/Half-Year, use the first period as representative key -->
                  <div v-if="dataEntry[part.id] && periods.length > 0">
                    {{ (() => {
                        const key = periods[0].date
                        if (!dataEntry[part.id][key]) {
                          dataEntry[part.id][key] = {
                            forecast_qty: 0,
                            qty_status: getAutoQtyStatus(key),
                            isNew: true
                          }
                        }
                        return ''
                    })() }}
                    <UInput
                      type="number"
                      v-model.number="dataEntry[part.id][periods[0].date].forecast_qty"
                      size="sm"
                      placeholder="Qty"
                      min="0"
                      class="max-w-[120px] mx-auto"
                      :disabled="!isEditable"
                    />
                  </div>
                </td>
                <td class="p-2 border-r border-default text-center">
                  <div v-if="dataEntry[part.id] && periods.length > 0">
                    <UBadge
                      :color="getQtyStatusColor(dataEntry[part.id][periods[0].date]?.qty_status || 'Temporary')"
                      variant="subtle"
                      size="xs"
                    >
                      {{ dataEntry[part.id][periods[0].date]?.qty_status || 'Temporary' }}
                    </UBadge>
                  </div>
                </td>
                <td class="p-3 text-center">
                  <UButton icon="i-lucide-trash" color="error" variant="ghost" size="sm" @click="removePart(part.id)" :disabled="!isEditable" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <!-- Upload Modal (simple inline) -->
    <UModal v-model:open="isUploadOpen" title="Import from Excel" description="Upload template file to import forecast details">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-2 p-3 rounded-lg bg-elevated/50 border border-default text-sm text-muted">
            <UIcon name="i-lucide-info" class="w-4 h-4 shrink-0" />
            Forecast type: <strong>{{ forecastType }}</strong>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            class="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary/80 cursor-pointer"
            @change="(e: any) => uploadFile = e.target.files?.[0] || null"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isUploadOpen = false" />
          <UButton
            color="primary"
            label="Upload"
            icon="i-lucide-upload"
            :disabled="!uploadFile"
            :loading="store.loading"
            @click="handleUpload"
          />
        </div>
      </template>
    </UModal>

    <!-- Review Modal -->
    <UModal v-model:open="isReviewOpen" title="Review Forecast" description="Review and update forecast status">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Status" required>
            <USelectMenu
              v-model="reviewForm.status"
              :items="['Approved', 'Rejected']"
              class="w-full"
            />
          </UFormField>
          <UFormField v-if="reviewForm.status === 'Rejected'" label="Remarks" required>
            <UTextarea
              v-model="reviewForm.remarks"
              placeholder="Enter rejection remarks..."
              class="w-full"
              rows="3"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isReviewOpen = false" />
          <UButton
            color="primary"
            label="Submit Review"
            :loading="store.loading"
            @click="confirmReview"
          />
        </div>
      </template>
    </UModal>

    <!-- Logs Modal -->
    <UModal v-model:open="isLogsOpen" title="Forecast Logs" description="Historical changes of this forecast" class="sm:max-w-3xl">
      <template #body>
        <div class="max-h-[60vh] overflow-y-auto pr-2">
          <div v-if="store.logs.length === 0" class="text-center py-8 text-muted">
            No logs found for this forecast.
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="log in store.logs"
              :key="log.id"
              class="relative pl-6 pb-4 border-l border-default last:pb-0"
            >
              <div class="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-bold" :class="getLogActionColor(log.action)">{{ log.action }}</span>
                  <span class="text-xs text-muted">{{ new Date(log.createdAt).toLocaleString() }}</span>
                </div>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div class="flex gap-2">
                    <span class="text-muted">By:</span>
                    <span class="font-medium">{{ log.user?.user_detail?.full_name || log.user?.email }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted">Version:</span>
                    <span class="font-medium">{{ log.version }}</span>
                  </div>
                  <div class="flex gap-2">
                    <span class="text-muted">Total Qty:</span>
                    <span class="font-medium text-success-600 font-mono">{{ log.total_qty?.toLocaleString() }}</span>
                  </div>
                </div>
                <div v-if="log.remarks" class="mt-1 p-2 rounded bg-elevated/50 border border-default text-xs italic text-muted">
                  {{ log.remarks }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end w-full">
          <UButton color="neutral" variant="ghost" label="Close" @click="isLogsOpen = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>
