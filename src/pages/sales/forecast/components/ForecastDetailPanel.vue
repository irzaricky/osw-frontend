<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useForecastStore } from '../../../../stores/sales/forecast.store'
import type { Forecast } from '../../../../types/sales/forecast'
import { useAppToast } from '../../../../composables/useAppToast'

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
const { toastSuccess, toastError } = useAppToast()
const toast = useToast()

// ─── Data ────────────────────────────────────────────────────────────────────
const periods = ref<{ date: string; label: string }[]>([])
const parts = ref<{ id: number; part_number: string; part_name: string }[]>([])
const dataEntry = ref<Record<number, Record<string, { forecast_qty: number; qty_status: string }>>>({})
const loadingDetail = ref(false)

// ─── Part Dropdown ───────────────────────────────────────────────────────────
const selectedNewPart = ref<number | undefined>(undefined)

const partItems = computed(() => store.partsDropdown.map(p => p.part_name))
const selectedPartLabel = computed({
  get: () => store.partsDropdown.find(p => p.id === selectedNewPart.value)?.part_name,
  set: (val) => {
    selectedNewPart.value = store.partsDropdown.find(p => p.part_name === val)?.id
  }
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
  }
}

function setupAdaptableTable(forecast: any) {
  periods.value = []
  const start = new Date(forecast.start_period)
  const end = new Date(forecast.end_period)
  let current = new Date(start)

  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const dateStr = `${year}-${month}-01`
    const label = current.toLocaleString('default', { month: 'short', year: 'numeric' })
    periods.value.push({ date: dateStr, label })
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
        qty_status: d.qty_status
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
  if (!selectedNewPart.value) return
  const partToAdd = store.partsDropdown.find(p => p.id === selectedNewPart.value)
  if (!partToAdd) return

  if (parts.value.find(p => p.id === partToAdd.id)) {
    toast.add({ title: 'Info', description: 'Part already in the table', color: 'info' })
    return
  }

  parts.value.push(partToAdd)
  dataEntry.value[partToAdd.id] = {}
  periods.value.forEach(p => {
    dataEntry.value[partToAdd.id][p.date] = { forecast_qty: 0, qty_status: 'Temporary' }
  })
  selectedNewPart.value = undefined
}

function removePart(partId: number) {
  parts.value = parts.value.filter(p => p.id !== partId)
  delete dataEntry.value[partId]
}

// ─── Save ─────────────────────────────────────────────────────────────────────
async function saveChanges() {
  const detailsToSave: any[] = []

  parts.value.forEach(part => {
    periods.value.forEach(period => {
      const entry = dataEntry.value[part.id]?.[period.date]
      if (entry) {
        detailsToSave.push({
          part_id: part.id,
          period_date: period.date,
          forecast_qty: entry.forecast_qty || 0,
          qty_status: entry.qty_status || 'Temporary'
        })
      }
    })
  })

  try {
    await store.updateForecast(props.forecastId, { details: detailsToSave })
    toastSuccess('Forecast details saved successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Approve ──────────────────────────────────────────────────────────────────
async function approveForecast() {
  try {
    await store.approveForecast(props.forecastId)
    toastSuccess('Forecast approved successfully')
    loadDetail()
    emit('refreshList')
  } catch (e: any) {
    toastError(e)
  }
}

// ─── Status Badge Color ───────────────────────────────────────────────────────
function getStatusColor(status: string) {
  const map: Record<string, string> = {
    Draft: 'neutral',
    Submitted: 'warning',
    Approved: 'success',
    Rejected: 'error'
  }
  return map[status] || 'neutral'
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
      <div v-else-if="store.detail" class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="min-w-0">
            <h2 class="text-lg font-bold truncate">{{ store.detail.forecast_number }}</h2>
            <p class="text-sm text-muted">{{ store.detail.customer?.name }}</p>
          </div>
          <UBadge
            :color="getStatusColor(store.detail.status)"
            variant="subtle"
            class="shrink-0"
          >
            {{ store.detail.status }}
          </UBadge>
        </div>
        <div class="flex gap-2 shrink-0">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="sm"
            label="Edit"
            @click="forecastSummary && emit('edit', forecastSummary)"
          />
          <UButton
            v-if="store.detail.status !== 'Approved'"
            icon="i-lucide-check-circle"
            color="success"
            variant="subtle"
            size="sm"
            label="Approve"
            @click="approveForecast"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="sm"
            @click="emit('delete', forecastId)"
          />
          <UButton
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
            <div class="text-sm font-semibold">{{ store.detail.start_period }} → {{ store.detail.end_period }}</div>
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

        <!-- Add Part -->
        <div class="flex items-end gap-2 bg-elevated/30 p-4 rounded-xl border border-default">
          <UFormField label="Add Part to Forecast" class="flex-1 max-w-sm">
            <USelectMenu
              v-model="selectedPartLabel"
              :items="partItems"
              placeholder="Search and select part..."
              class="w-full"
              clear
              searchable
            />
          </UFormField>
          <UButton
            label="Add"
            color="neutral"
            variant="outline"
            icon="i-lucide-plus"
            @click="addNewPart"
            :disabled="!selectedNewPart"
          />
        </div>

        <!-- Adaptable Table -->
        <div class="overflow-x-auto border border-default rounded-xl">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-elevated/50 border-b border-default">
              <tr>
                <th class="p-3 font-medium border-r border-default min-w-[200px]">Part</th>
                <th
                  v-for="period in periods"
                  :key="period.date"
                  class="p-3 font-medium border-r border-default min-w-[140px] text-center"
                >
                  {{ period.label }}
                </th>
                <th class="p-3 font-medium w-14 text-center">Act</th>
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
                <td class="p-3 border-r border-default">
                  <div class="font-medium">{{ part.part_number }}</div>
                  <div class="text-xs text-muted line-clamp-1">{{ part.part_name }}</div>
                </td>
                <td
                  v-for="period in periods"
                  :key="period.date"
                  class="p-2 border-r border-default align-top"
                >
                  <div class="flex flex-col gap-1.5" v-if="dataEntry[part.id]">
                    {{ (() => {
                        if (!dataEntry[part.id][period.date]) {
                          dataEntry[part.id][period.date] = { forecast_qty: 0, qty_status: 'Temporary' }
                        }
                        return ''
                    })() }}
                    <UInput
                      type="number"
                      v-model.number="dataEntry[part.id][period.date].forecast_qty"
                      size="sm"
                      placeholder="Qty"
                      min="0"
                    />
                    <USelect
                      v-model="dataEntry[part.id][period.date].qty_status"
                      :items="[{ label: 'Temporary', value: 'Temporary' }, { label: 'Fix', value: 'Fix' }]"
                      size="sm"
                    />
                  </div>
                </td>
                <td class="p-3 text-center">
                  <UButton
                    icon="i-lucide-trash"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="removePart(part.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>
