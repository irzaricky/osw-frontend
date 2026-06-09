<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useSpoStore } from '../../../../stores/sales/spo.store'
import { storeToRefs } from 'pinia'
import type { Spo } from '../../../../types/sales/spo'
import HomeDateRangePicker from '../../../../components/home/HomeDateRangePicker.vue'

const props = defineProps<{
  status: string
  search?: string
}>()

const emit = defineEmits<{
  (e: 'select', spo: Spo): void
}>()

const store = useSpoStore()
const sentinel = ref<HTMLElement | null>(null)
const isFilterOpen = ref(false)

const { kanbanSpos, kanbanMeta, kanbanFilters, customersDropdown } = storeToRefs(store)

const items = computed(() => kanbanSpos.value[props.status] || [])
const meta = computed(() => kanbanMeta.value[props.status] || { page: 1, total: 0, totalPages: 0, loading: false })

const columnFilter = computed({
  get() {
    if (!kanbanFilters.value[props.status]) {
      kanbanFilters.value[props.status] = { customer_id: undefined, start_date: '', end_date: '' }
    }
    return kanbanFilters.value[props.status]
  },
  set(val) {
    kanbanFilters.value[props.status] = val
  }
})

const dateRange = computed<any>({
  get() {
    const start = columnFilter.value.start_date ? new Date(columnFilter.value.start_date) : undefined
    const end = columnFilter.value.end_date ? new Date(columnFilter.value.end_date) : undefined
    return { start, end }
  },
  set(val) {
    if (val) {
      columnFilter.value.start_date = val.start ? formatDateToYYYYMMDD(val.start) : ''
      columnFilter.value.end_date = val.end ? formatDateToYYYYMMDD(val.end) : ''
    } else {
      columnFilter.value.start_date = ''
      columnFilter.value.end_date = ''
    }
  }
})

function formatDateToYYYYMMDD(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const hasActiveFilter = computed(() => !!columnFilter.value.customer_id || !!columnFilter.value.start_date || !!columnFilter.value.end_date)

function applyFilter() {
  store.kanbanMeta[props.status] = { page: 1, total: 0, totalPages: 0, loading: false }
  store.kanbanSpos[props.status] = []
  store.fetchKanbanByStatus(props.status, { search: props.search }, false)
}

function clearFilter() {
  columnFilter.value = { customer_id: undefined, start_date: '', end_date: '' }
  applyFilter()
}

// Intersection Observer for Infinite Scroll
useIntersectionObserver(
  sentinel,
  ([{ isIntersecting }]) => {
    if (isIntersecting && !meta.value.loading && items.value.length > 0) {
      if (meta.value.page < meta.value.totalPages) {
        store.fetchKanbanByStatus(props.status, { search: props.search }, true)
      }
    }
  },
  { threshold: 0.1 }
)

// Helper functions
function getStatusBulletClass(status: string) {
  const map: Record<string, string> = {
    Draft: 'bg-neutral-500',
    Submitted: 'bg-warning-500',
    Locked: 'bg-success-500',
    Processing: 'bg-info-500',
    Completed: 'bg-purple-500'
  }
  return map[status] || 'bg-neutral-500'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col w-80 bg-elevated/40 rounded-2xl border border-default/60 backdrop-blur-sm overflow-hidden h-full">
    <!-- Column Header -->
    <div class="p-4 border-b border-default flex items-center justify-between shrink-0 bg-elevated/20">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full" :class="getStatusBulletClass(status)" />
        <h3 class="font-bold text-xs uppercase tracking-widest text-muted-foreground">
          {{ status }}
        </h3>
      </div>
      <div class="flex items-center gap-2">
        <UPopover v-model:open="isFilterOpen" :content="{ align: 'end', side: 'bottom' }">
          <UButton
            icon="i-lucide-filter"
            size="sm"
            variant="ghost"
            :color="hasActiveFilter ? 'primary' : 'neutral'"
            :class="hasActiveFilter ? 'bg-primary/10' : ''"
          />
          <template #content>
            <div class="p-4 space-y-4 w-64 bg-default border border-default rounded-xl shadow-xl z-50">
              <h4 class="font-bold text-sm">
                Filter {{ status }}
              </h4>
              
              <UFormField label="Customer" size="sm">
                <USelectMenu
                  v-model="columnFilter.customer_id"
                  :items="customersDropdown"
                  value-key="id"
                  label-key="name"
                  placeholder="All Customers"
                  searchable
                  clear
                />
              </UFormField>
              <UFormField label="Date Range" size="sm">
                <HomeDateRangePicker
                  v-model="dateRange"
                  clear
                />
              </UFormField>

              <div class="flex justify-end gap-2 pt-2 border-t border-default/50">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  label="Clear"
                  @click="clearFilter(); isFilterOpen = false"
                />
                <UButton
                  size="xs"
                  color="primary"
                  label="Apply"
                  @click="applyFilter(); isFilterOpen = false"
                />
              </div>
            </div>
          </template>
        </UPopover>

        <span class="text-[10px] font-bold font-mono text-muted-foreground bg-default px-1.5 py-0.5 rounded border border-default">
          {{ meta.total }}
        </span>
      </div>
    </div>

    <!-- Column Content -->
    <div class="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
      <!-- Initial Loading -->
      <div v-if="meta.loading && items.length === 0" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-28 bg-default/50 animate-pulse rounded-xl" />
      </div>

      <!-- Cards -->
      <template v-else>
        <div
          v-for="spo in items"
          :key="spo.id"
          class="group relative bg-default border border-default rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer ring-primary/20 hover:ring-2"
          @click="emit('select', spo)"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">{{ spo.spo_number }}</span>
            <UIcon name="i-lucide-arrow-up-right" class="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <h4 class="text-sm font-bold mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
            {{ spo.customer?.name || '-' }}
          </h4>
          
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <UIcon name="i-lucide-hash" class="w-3 h-3" />
              <span class="font-mono truncate">{{ spo.spr?.spr_number || 'Manual' }}</span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <UIcon name="i-lucide-calendar-days" class="w-3 h-3" />
              <span>Due: {{ formatDate(spo.delivery_due_date) }}</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-default/50 flex items-center justify-between">
            <div class="flex items-center gap-1">
              <UIcon name="i-lucide-package" class="w-3 h-3 text-muted" />
              <span class="text-[10px] font-bold">{{ spo.details?.length || 0 }} items</span>
            </div>
            <div class="text-[10px] text-muted-foreground font-medium">
              {{ formatDate(spo.spo_date) }}
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="items.length === 0 && !meta.loading" class="h-full flex flex-col items-center justify-center text-muted-foreground/30 py-16">
          <UIcon name="i-lucide-inbox" class="w-10 h-10 mb-3 opacity-20" />
          <span class="text-[11px] font-medium uppercase tracking-tighter">No SPO</span>
        </div>

        <!-- Sentinel for Infinite Scroll -->
        <div ref="sentinel" class="h-10 w-full flex items-center justify-center">
          <UIcon v-if="meta.loading" name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-primary/50" />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
