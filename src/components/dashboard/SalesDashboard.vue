<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import sprService from '../../services/sales/spr.service'
import spoService from '../../services/sales/spo.service'
import forecastService from '../../services/sales/forecast.service'

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
  type: 'SPR' | 'SPO' | 'Forecast'
  doc_number: string
  date: string
  to: string
}

const reviewItems = ref<ReviewItem[]>([])
const reviewLoading = ref(false)

async function fetchReviewItems() {
  reviewLoading.value = true
  try {
    const [sprRes, spoRes, frcRes] = await Promise.allSettled([
      sprService.getSprs({ status: 'Waiting Review Sales', limit: 10 }),
      spoService.getSpos({ status: 'Submitted', limit: 10 }),
      forecastService.getForecasts({ status: 'Submitted', limit: 10 })
    ])

    const items: ReviewItem[] = []

    if (sprRes.status === 'fulfilled') {
      const rows = sprRes.value?.data?.data?.rows || sprRes.value?.data?.data || []
      for (const row of rows) {
        items.push({ type: 'SPR', doc_number: row.spr_number, date: row.request_date, to: '/sales/spr' })
      }
    }

    if (spoRes.status === 'fulfilled') {
      const rows = spoRes.value?.data?.data?.rows || spoRes.value?.data?.data || []
      for (const row of rows) {
        items.push({ type: 'SPO', doc_number: row.spo_number, date: row.spo_date, to: '/sales/spo' })
      }
    }

    if (frcRes.status === 'fulfilled') {
      const rows = frcRes.value?.data?.data?.rows || frcRes.value?.data?.data || []
      for (const row of rows) {
        items.push({ type: 'Forecast', doc_number: row.forecast_number, date: row.start_period, to: '/sales/forecast' })
      }
    }

    // Sort by date descending
    items.sort((a, b) => (a.date < b.date ? 1 : -1))
    reviewItems.value = items
  } catch (e) {
    console.error('Error fetching review items:', e)
  } finally {
    reviewLoading.value = false
  }
}

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

    <!-- Supervisor Pending Actions — Combined Needs Review Table -->
    <div v-if="isSupervisor" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
          <UIcon name="i-lucide-clipboard-list" class="w-4 h-4 text-warning" />
          Needs Review
        </h2>
        <UBadge
          v-if="reviewItems.length"
          color="warning"
          variant="subtle"
          size="sm"
        >
          {{ reviewItems.length }} pending
        </UBadge>
      </div>

      <UCard>
        <!-- Loading skeleton -->
        <div v-if="reviewLoading" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
        </div>

        <!-- Empty state -->
        <div v-else-if="!reviewItems.length" class="text-center py-8 text-muted">
          <UIcon name="i-lucide-check-circle" class="w-10 h-10 mx-auto mb-2 text-success" />
          <p class="text-sm font-medium">
            All caught up!
          </p>
          <p class="text-xs mt-1">
            No documents pending your review.
          </p>
        </div>

        <!-- Review item rows -->
        <div v-else class="divide-y divide-default">
          <RouterLink
            v-for="item in reviewItems"
            :key="`${item.type}-${item.doc_number}`"
            :to="item.to"
            class="flex items-center gap-3 py-3 px-2 hover:bg-elevated rounded-lg transition-colors cursor-pointer"
          >
            <UBadge
              :color="item.type === 'SPR' ? 'warning' : item.type === 'SPO' ? 'primary' : 'success'"
              variant="subtle"
              size="xs"
              class="w-20 justify-center shrink-0"
            >
              {{ item.type }}
            </UBadge>
            <span class="font-mono text-sm font-semibold text-default flex-1">{{ item.doc_number }}</span>
            <span class="text-xs text-muted shrink-0">{{ item.date }}</span>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted shrink-0" />
          </RouterLink>
        </div>
      </UCard>
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
