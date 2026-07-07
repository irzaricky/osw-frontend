<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import sprService from '../../services/sales/spr.service'
import spoService from '../../services/sales/spo.service'
import forecastService from '../../services/sales/forecast.service'
import sdoService from '../../services/sales/sdo.service'

const authStore = useAuthStore()
const router = useRouter()

const isSupervisor = computed(() => {
  const r = authStore.user?.role?.toLowerCase()
  return r === 'superadmin' || r === 'supervisor sales'
})

const quickLinks = [
  { title: 'Forecast', description: 'Monthly Sales Forecast', icon: 'i-lucide-badge-dollar-sign', to: '/sales/forecast' },
  { title: 'Create SPR', description: 'Sales Purchase Request', icon: 'i-lucide-file-text', to: '/sales/spr' },
  { title: 'Create SPO', description: 'Sales Purchase Order', icon: 'i-lucide-file-check', to: '/sales/spo' },
  { title: 'Delivery Plan', description: 'Schedule Deliveries (SDP)', icon: 'i-lucide-calendar-days', to: '/sales/sdp' },
  { title: 'Delivery Order', description: 'Execute Deliveries (SDO)', icon: 'i-lucide-truck', to: '/sales/sdo' },
  { title: 'Analytics', description: 'Sales Performance Reports', icon: 'i-lucide-bar-chart-2', to: '/sales/analytics' }
]

const filteredQuickLinks = computed(() => {
  return quickLinks.filter(link => {
    if (!link.to) return true
    const resolved = router.resolve(link.to)
    if (resolved && resolved.meta && resolved.meta.allowedRoles) {
      const roles = resolved.meta.allowedRoles as string[]
      const userRole = authStore.user?.role
      return roles.some(role => role.toLowerCase() === userRole?.toLowerCase())
    }
    return true
  })
})

// ─── Needs Review Table ────────────────────────────────────────────────────────
interface ReviewItem {
  doc_number: string
  date: string
  to: string
}

const sprReviewItems = ref<ReviewItem[]>([])
const spoReviewItems = ref<ReviewItem[]>([])
const forecastReviewItems = ref<ReviewItem[]>([])
const sdoReviewItems = ref<ReviewItem[]>([])
const reviewLoading = ref(false)

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function fetchReviewItems() {
  reviewLoading.value = true
  try {
    const [sprRes, spoRes, frcRes, sdoRes] = await Promise.allSettled([
      sprService.getSprs({ status: 'Waiting Review Sales', limit: 10 }),
      spoService.getSpos({ status: 'Submitted', limit: 10 }),
      forecastService.getForecasts({ status: 'Submitted', limit: 10 }),
      sdoService.getSdos({ delivery_status: 'Loading', limit: 10 })
    ])

    if (sprRes.status === 'fulfilled') {
      const rows = sprRes.value?.data?.data?.rows || sprRes.value?.data?.data || []
      sprReviewItems.value = rows.map((row: any) => ({
        doc_number: row.spr_number,
        date: row.request_date,
        to: '/sales/spr'
      }))
    }

    if (spoRes.status === 'fulfilled') {
      const rows = spoRes.value?.data?.data?.rows || spoRes.value?.data?.data || []
      spoReviewItems.value = rows.map((row: any) => ({
        doc_number: row.spo_number,
        date: row.spo_date,
        to: '/sales/spo'
      }))
    }

    if (frcRes.status === 'fulfilled') {
      const rows = frcRes.value?.data?.data?.rows || frcRes.value?.data?.data || []
      forecastReviewItems.value = rows.map((row: any) => ({
        doc_number: row.forecast_number,
        date: row.start_period,
        to: '/sales/forecast'
      }))
    }

    if (sdoRes.status === 'fulfilled') {
      const rows = sdoRes.value?.data?.data?.rows || sdoRes.value?.data?.data || []
      sdoReviewItems.value = rows
        .filter((row: any) => !row.dispatch_approved_by)
        .map((row: any) => ({
          doc_number: row.do_number,
          date: row.shipment_date,
          to: '/sales/sdo'
        }))
    }
  } catch (e) {
    console.error('Error fetching review items:', e)
  } finally {
    reviewLoading.value = false
  }
}

const totalPending = computed(() => {
  return sprReviewItems.value.length + spoReviewItems.value.length + forecastReviewItems.value.length + sdoReviewItems.value.length
})

onMounted(() => {
  if (isSupervisor.value) {
    fetchReviewItems()
  }
})
</script>

<template>
  <div class="p-6 space-y-8 animate-fade-in max-w-7xl mx-auto">
    <!-- Welcome Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-default">
          Welcome back, {{ authStore.user?.name || 'User' }}
        </h1>
      </div>
      <UBadge
        color="primary"
        variant="subtle"
        size="lg"
        class="capitalize font-bold px-3"
      >
        Role: {{ authStore.user?.role }}
      </UBadge>
    </div>

    <!-- Supervisor Pending Actions — Divided Needs Review -->
    <div v-if="isSupervisor" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
          <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-warning" />
          Needs Review
        </h2>
        <UBadge
          v-if="totalPending"
          color="warning"
          variant="subtle"
          size="sm"
        >
          {{ totalPending }} pending
        </UBadge>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 1. Forecast Review Card -->
        <UCard class="flex flex-col h-full bg-elevated/40">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <UIcon name="i-lucide-badge-dollar-sign" class="w-4 h-4" />
                Forecast Reviews
              </h3>
              <UBadge v-if="forecastReviewItems.length" color="primary" variant="subtle" size="sm">
                {{ forecastReviewItems.length }}
              </UBadge>
            </div>
          </template>

          <div v-if="reviewLoading" class="space-y-2">
            <USkeleton v-for="i in 2" :key="i" class="h-8 w-full" />
          </div>
          <div v-else-if="!forecastReviewItems.length" class="text-center py-4 text-xs text-muted">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 mx-auto mb-1 text-success/60" />
            No Forecasts pending review.
          </div>
          <div v-else class="divide-y divide-default max-h-[160px] overflow-y-auto pr-1">
            <RouterLink
              v-for="item in forecastReviewItems"
              :key="item.doc_number"
              :to="item.to"
              class="flex items-center justify-between py-2 px-1 hover:bg-elevated rounded transition-colors"
            >
              <span class="font-mono text-xs font-semibold text-default">{{ item.doc_number }}</span>
              <span class="text-[10px] text-muted">{{ formatDate(item.date) }}</span>
            </RouterLink>
          </div>
        </UCard>

        <!-- 2. SPR Review Card -->
        <UCard class="flex flex-col h-full bg-elevated/40">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold flex items-center gap-2 text-warning uppercase tracking-wider">
                <UIcon name="i-lucide-file-text" class="w-4 h-4" />
                SPR Reviews
              </h3>
              <UBadge v-if="sprReviewItems.length" color="warning" variant="subtle" size="sm">
                {{ sprReviewItems.length }}
              </UBadge>
            </div>
          </template>

          <div v-if="reviewLoading" class="space-y-2">
            <USkeleton v-for="i in 2" :key="i" class="h-8 w-full" />
          </div>
          <div v-else-if="!sprReviewItems.length" class="text-center py-4 text-xs text-muted">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 mx-auto mb-1 text-success/60" />
            No SPRs pending review.
          </div>
          <div v-else class="divide-y divide-default max-h-[160px] overflow-y-auto pr-1">
            <RouterLink
              v-for="item in sprReviewItems"
              :key="item.doc_number"
              :to="item.to"
              class="flex items-center justify-between py-2 px-1 hover:bg-elevated rounded transition-colors"
            >
              <span class="font-mono text-xs font-semibold text-default">{{ item.doc_number }}</span>
              <span class="text-[10px] text-muted">{{ formatDate(item.date) }}</span>
            </RouterLink>
          </div>
        </UCard>

        <!-- 3. SPO Review Card -->
        <UCard class="flex flex-col h-full bg-elevated/40">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold flex items-center gap-2 text-info uppercase tracking-wider">
                <UIcon name="i-lucide-file-check" class="w-4 h-4" />
                SPO Reviews
              </h3>
              <UBadge v-if="spoReviewItems.length" color="info" variant="subtle" size="sm">
                {{ spoReviewItems.length }}
              </UBadge>
            </div>
          </template>

          <div v-if="reviewLoading" class="space-y-2">
            <USkeleton v-for="i in 2" :key="i" class="h-8 w-full" />
          </div>
          <div v-else-if="!spoReviewItems.length" class="text-center py-4 text-xs text-muted">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 mx-auto mb-1 text-success/60" />
            No SPOs pending review.
          </div>
          <div v-else class="divide-y divide-default max-h-[160px] overflow-y-auto pr-1">
            <RouterLink
              v-for="item in spoReviewItems"
              :key="item.doc_number"
              :to="item.to"
              class="flex items-center justify-between py-2 px-1 hover:bg-elevated rounded transition-colors"
            >
              <span class="font-mono text-xs font-semibold text-default">{{ item.doc_number }}</span>
              <span class="text-[10px] text-muted">{{ formatDate(item.date) }}</span>
            </RouterLink>
          </div>
        </UCard>

        <!-- 4. SDO Review Card -->
        <UCard class="flex flex-col h-full bg-elevated/40">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold flex items-center gap-2 text-success uppercase tracking-wider">
                <UIcon name="i-lucide-truck" class="w-4 h-4" />
                SDO Dispatch Reviews
              </h3>
              <UBadge v-if="sdoReviewItems.length" color="success" variant="subtle" size="sm">
                {{ sdoReviewItems.length }}
              </UBadge>
            </div>
          </template>

          <div v-if="reviewLoading" class="space-y-2">
            <USkeleton v-for="i in 2" :key="i" class="h-8 w-full" />
          </div>
          <div v-else-if="!sdoReviewItems.length" class="text-center py-4 text-xs text-muted">
            <UIcon name="i-lucide-check-circle" class="w-5 h-5 mx-auto mb-1 text-success/60" />
            No SDOs pending dispatch approval.
          </div>
          <div v-else class="divide-y divide-default max-h-[160px] overflow-y-auto pr-1">
            <RouterLink
              v-for="item in sdoReviewItems"
              :key="item.doc_number"
              :to="item.to"
              class="flex items-center justify-between py-2 px-1 hover:bg-elevated rounded transition-colors"
            >
              <span class="font-mono text-xs font-semibold text-default">{{ item.doc_number }}</span>
              <span class="text-[10px] text-muted">{{ formatDate(item.date) }}</span>
            </RouterLink>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="space-y-4">
      <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
        <UIcon name="i-lucide-zap" class="w-4 h-4 text-success" />
        Quick Actions
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <RouterLink v-for="link in filteredQuickLinks" :key="link.title" :to="link.to">
          <div class="bg-elevated border border-default hover:border-primary/50 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group h-full">
            <UIcon :name="link.icon" class="w-6 h-6 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
            <h3 class="font-bold text-default group-hover:text-primary transition-colors">
              {{ link.title }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              {{ link.description }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
