<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { onMounted, ref, computed, watch } from 'vue'
import { useSdpStore } from '../../../stores/sales/sdp.store'
import Breadcrumbs from '../../../components/Breadcrumbs.vue'
import { storeToRefs } from 'pinia'
import SdpAddModal from './components/SdpAddModal.vue'
import SdpDetailPanel from './components/SdpDetailPanel.vue'

const store = useSdpStore()
const { loading, plans, meta } = storeToRefs(store)

const breadcrumbItems = [
  { label: 'Home', to: '/' },
  { label: 'Sales' },
  { label: 'Delivery Plan (SDP)' }
]

// Modal & Panel state controls
const openAddModal = ref(false)
const selectedPlanId = ref<number | null>(null)
const createLoading = ref(false)

const selectedPlan = computed(() => store.detail)

// Search & filter parameters
const searchQuery = ref('')
const selectedStatus = ref('')
const startDate = ref('')
const endDate = ref('')

async function loadPlans() {
  const params: Record<string, any> = {
    page: meta.value.page,
    limit: meta.value.limit
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (selectedStatus.value) params.status = selectedStatus.value
  if (startDate.value) params.start_date = startDate.value
  if (endDate.value) params.end_date = endDate.value

  await store.fetchSdpPlans(params)
}

// Watchers for filtering
watch([searchQuery, selectedStatus, startDate, endDate], () => {
  meta.value.page = 1 // reset page
  loadPlans()
})

onMounted(() => {
  loadPlans()
})

// Master-detail click handler
async function selectPlan(id: number) {
  selectedPlanId.value = id
  try {
    await store.fetchSdpById(id)
  } catch (e) {
    console.error('Failed to load plan details', e)
  }
}

// Form Submission Save Handler
async function handleSavePlan(payload: any) {
  createLoading.value = true
  try {
    const res = await store.createSdp(payload)
    if (res.status) {
      openAddModal.value = false
      await loadPlans()
      alert('Sales Delivery Plan scheduled successfully!')
    } else {
      alert(res.message || 'Failed to schedule plan.')
    }
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Error occurred while saving.'
    alert(`Scheduling Failed: ${msg}`)
  } finally {
    createLoading.value = false
  }
}

// Deletion Handler
async function handleDeletePlan(id: number) {
  if (!confirm('Are you sure you want to delete this delivery plan? This action cannot be undone.')) {
    return
  }
  try {
    const res = await store.deleteSdp(id)
    if (res.status) {
      selectedPlanId.value = null
      store.detail = null
      await loadPlans()
      alert('Plan deleted successfully.')
    } else {
      alert(res.message || 'Failed to delete plan.')
    }
  } catch (e: any) {
    alert(`Deletion Failed: ${e.response?.data?.message || e.message}`)
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Breadcrumbs & Header -->
    <div class="px-6 pt-6 pb-4 border-b border-default space-y-3 shrink-0 bg-elevated/40">
      <Breadcrumbs :items="breadcrumbItems" />
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">
            Sales Delivery Plan (SDP)
          </h1>
        </div>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="solid"
          label="New Scheduling Plan"
          @click="openAddModal = true"
        />
      </div>
    </div>

    <!-- Active State & Visual Shell -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left side: List and Metrics -->
      <div class="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        <!-- Filter bar -->
        <div class="bg-elevated rounded-xl p-4 border border-default flex flex-wrap gap-3 items-center justify-between shrink-0">
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search field -->
            <UInput
              v-model="searchQuery"
              placeholder="Search plan code or destination..."
              icon="i-lucide-search"
              class="w-64"
            />
            
            <!-- Date Filters -->
            <UInput
              v-model="startDate"
              type="date"
              class="w-40"
              placeholder="Start Date"
            />
            <span class="text-xs text-muted font-bold">to</span>
            <UInput
              v-model="endDate"
              type="date"
              class="w-40"
              placeholder="End Date"
            />
          </div>
          
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            label="Reset Filters"
            @click="searchQuery = ''; startDate = ''; endDate = '';"
          />
        </div>

        <!-- Main Workspace List Section -->
        <div class="flex-1 min-h-[400px] flex flex-col">
          <div v-if="loading && plans.length === 0" class="flex-1 flex items-center justify-center p-12 text-center">
            <UIcon name="i-lucide-loader" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <div v-else-if="plans.length === 0" class="flex-1 bg-elevated border border-default rounded-2xl flex flex-col items-center justify-center p-12 text-center gap-3">
            <div class="w-16 h-16 bg-default rounded-full flex items-center justify-center text-muted mb-2">
              <UIcon name="i-lucide-calendar-days" class="w-8 h-8 text-default" />
            </div>
            <div>
              <h3 class="font-bold text-default text-lg">
                No Schedules Scheduled
              </h3>
              <p class="text-xs text-muted mt-1 max-w-sm">
                Get started by clicking the "New Scheduling Plan" button to arrange loading dock times and deliver pending orders.
              </p>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="bg-elevated rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden p-4 flex flex-col justify-between h-[160px] hover:shadow-lg relative"
              :class="selectedPlanId === plan.id
                ? 'border-primary shadow bg-primary-50/5 dark:bg-primary-950/5'
                : 'border-default'"
              @click="selectPlan(plan.id)"
            >
              <!-- Active Highlight Side bar Indicator -->
              <div
                v-if="selectedPlanId === plan.id"
                class="absolute left-0 top-0 bottom-0 w-1 bg-primary"
              />

              <!-- Top Row Info -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                    {{ plan.dp_number }}
                  </span>
                  
                  <div class="flex items-center gap-1.5 text-[10px] text-muted font-bold">
                    <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-amber-500" />
                    <span>{{ plan.time_start.slice(0, 5) }} – {{ plan.time_end.slice(0, 5) }}</span>
                  </div>
                </div>

                <h4 class="text-sm font-bold text-default mt-1.5 leading-relaxed truncate">
                  {{ plan.destination }}
                </h4>
              </div>

              <!-- Mid Info -->
              <div class="grid grid-cols-2 gap-2 mt-2.5 text-[10px] text-muted border-t border-default/50 pt-2.5">
                <div class="flex items-center gap-1.5 font-medium truncate">
                  <UIcon name="i-lucide-warehouse" class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Whse: {{ plan.warehouse?.name || '-' }}</span>
                </div>
                <div class="flex items-center gap-1.5 font-medium truncate">
                  <UIcon name="i-lucide-navigation" class="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Dock: {{ plan.dock?.name || '-' }}</span>
                </div>
              </div>

              <!-- Bottom Row Info -->
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-primary shrink-0" />
                  <span class="text-[10px] font-bold text-default">
                    {{ new Date(plan.scheduled_date).toLocaleDateString('id-ID') }}
                  </span>
                </div>

                <UBadge
                  color="primary"
                  variant="subtle"
                  size="xs"
                  class="rounded-full"
                >
                  {{ plan.details?.length || 0 }} items planned
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Master-Detail Panel Info -->
      <div class="w-[400px] shrink-0 border-l border-default bg-elevated/40 h-full">
        <SdpDetailPanel
          :plan="selectedPlan"
          :loading="loading"
          @close="selectedPlanId = null; store.detail = null"
          @delete="handleDeletePlan"
          @refresh="loadPlans(); selectPlan(selectedPlanId!)"
        />
      </div>
    </div>

    <!-- Modals -->
    <SdpAddModal
      v-model:open="openAddModal"
      :loading="createLoading"
      @save="handleSavePlan"
    />
  </div>
</template>
