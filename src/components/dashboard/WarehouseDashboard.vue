<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import materialReceivingService from '../../services/warehouse/material-receiving.service'
import goodReceiptService from '../../services/warehouse/good-receipt.service'
import placementService from '../../services/warehouse/placement.service'
import takeOutService from '../../services/warehouse/take-out.service'
import warehouseAnalyticsService from '../../services/warehouse/analytics.service'

const authStore = useAuthStore()
const router = useRouter()

const isSupervisor = computed(() => {
  const r = authStore.user?.role?.toLowerCase()
  return r === 'superadmin' || r === 'admin warehouse' || r === 'supervisor warehouse'
})

const isStaff = computed(() => {
  const r = authStore.user?.role?.toLowerCase()
  return r === 'superadmin' || r === 'admin warehouse' || r === 'warehouse staff'
})

const quickLinks = [
  { title: 'Material Receiving', description: 'Receive and inspect materials', icon: 'i-lucide-package-check', to: '/warehouse/material-receiving' },
  { title: 'Good Receipt', description: 'Approve receipts', icon: 'i-lucide-clipboard-check', to: '/warehouse/good-receipt' },
  { title: 'Warranty & Claim', description: 'Review claims', icon: 'i-lucide-shield-alert', to: '/warehouse/warranty-and-claim' },
  { title: 'Work Order Storing', description: 'Store materials for work orders', icon: 'i-lucide-box', to: '/warehouse/work-order-storing' },
  { title: 'Placement', description: 'Place incoming goods', icon: 'i-lucide-package-plus', to: '/warehouse/placement' },
  { title: 'Take Out', description: 'Take goods from warehouse', icon: 'i-lucide-package-minus', to: '/warehouse/take-out' },
  { title: 'Transaction Activity', description: 'Warehouse transactions', icon: 'i-lucide-history', to: '/warehouse/transaction-activity' },
  { title: 'Stock Monitoring', description: 'Monitor stock levels', icon: 'i-lucide-boxes', to: '/warehouse/stock-monitoring' },
  { title: 'Warehouse Layout', description: 'Manage layout', icon: 'i-lucide-layout-grid', to: '/warehouse/layout' },
  { title: 'Critical Stock', description: 'Check low stock items', icon: 'i-lucide-triangle-alert', to: '/warehouse/critical-stock' },
  { title: 'Analytics', description: 'Warehouse insights', icon: 'i-lucide-bar-chart-2', to: '/warehouse/analytics' }
]

const filteredQuickLinks = computed(() => {
  return quickLinks.filter(link => {
    const resolved = router.resolve(link.to)

    if (resolved?.meta?.allowedRoles) {
      const roles = resolved.meta.allowedRoles as string[]
      const userRole = authStore.user?.role

      return roles.some(role => role.toLowerCase() === userRole?.toLowerCase())
    }

    return true
  })
})

interface StaffTaskItem {
  type: 'Incoming' | 'Placement' | 'Take Out'
  doc_number: string
  subtitle: string
  date: string
  to: string
}

const staffTasks = ref<StaffTaskItem[]>([])
const staffTaskLoading =ref(false)

interface ApprovalItem {
  id: number
  do_number: string
  po_number: string
  supplier: string
  arrived_at: string | null
  to: string
}

const approvalItems = ref<ApprovalItem[]>([])
const approvalLoading = ref(false)

async function fetchStaffTasks() {
  staffTaskLoading.value = true
  try {
    const [ incomingRes, placementRes, takeOutRes ] = await Promise.allSettled([
      materialReceivingService.getMaterialReceivings({ status: 'in transit', limit: 5 }),
      placementService.getPlacements({ wo_status_id: 2, limit: 5 }),
      takeOutService.getTakeOuts({ wo_status_id: 2, limit: 5 })
    ])

    const items: StaffTaskItem[] = []

    // Incoming
    if (incomingRes.status === 'fulfilled') {
      const rows = incomingRes.value?.data?.data?.rows || incomingRes.value?.data?.data || []
      for (const row of rows) {
        items.push({
          type: 'Incoming',
          doc_number: row.number,
          subtitle: row.warehouse,
          date: row.target_date,
          to: '/warehouse/material-receiving'
        })
      }
    }

    // Placement
    if (placementRes.status === 'fulfilled') {
      const rows = placementRes.value.data?.data?.rows || placementRes.value.data?.data || []
      for (const row of rows) {
        items.push({
          type: 'Placement',
          doc_number: row.wo_number,
          subtitle: row.area?.name,
          date: row.wo_date,
          to: '/warehouse/placement'
        })
      }
    }

    // Take Out
    if (takeOutRes.status === 'fulfilled') {
      const rows = takeOutRes.value.data?.data?.rows || takeOutRes.value.data?.data || []
      for (const row of rows) {
        items.push({
          type: 'Take Out',
          doc_number: row.wo_number,
          subtitle: row.area?.name,
          date: row.wo_date,
          to: '/warehouse/take-out'
        })
      }
    }

    // Sort by date descending
    items.sort((a, b) => (a.date < b.date ? 1 : -1))
    staffTasks.value = items
  } catch (e) {
    console.error('Error fetching staff tasks:', e)
  } finally {
    staffTaskLoading.value = false
  }
}

async function fetchApprovalItems() {
  approvalLoading.value = true
  try {
    const res = await goodReceiptService.getGoodReceipts({status_id: 4, limit: 10})

    const rows = res.data.data?.rows || res.data.data || []

    approvalItems.value =
      rows.map((row: any) => ({
        id: row.id,
        do_number: row.do_number || '-',
        po_number: row.po_number || '-',
        supplier: row.supplier || '-',
        arrived_at: row.arrived_at,
        to: '/warehouse/good-receipt'
      }))
  } catch (e) {
    console.error('Error fetching approval items:', e)
  } finally {
    approvalLoading.value = false
  }
}

const filters = reactive({
  date_from: '',
  date_to: '',
  warehouse_area_id: undefined as number | undefined,
  part_category: undefined as string | undefined,
  movement_type: undefined as string | undefined,
  part_number: ''
})

const loading = reactive({
  movement: false,
  inventoryValue: false
})

const stockMovement = reactive<any[]>([])

const inventoryValue = reactive<any>({
  summary: {},
  by_area: [],
  by_category: []
})

const totalInventoryValue = computed(() => {
  return Number(inventoryValue.summary?.total_inventory_value || 0)
})

const movementChartOptions = computed(() => ({
  chart: {
    type: 'line',
    background: 'transparent',
    toolbar: {
      show: false
    }
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  dataLabels: {
    enabled: false
  },
  grid: {
    borderColor: '#27272a'
  },
  tooltip: {
    theme: 'dark'
  },
  legend: {
    position: 'top'
  },
  xaxis: {
    categories: stockMovement.map(row => row.movement_date),
    labels: {
      style: {
        colors: '#a1a1aa'
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        colors: '#a1a1aa'
      }
    }
  }
}))

const movementChartSeries = computed(() => [
  {
    name: 'Placement',
    data: stockMovement.map(row => Number(row.placement || 0))
  },
  {
    name: 'Take Out',
    data: stockMovement.map(row => Number(row.take_out || 0))
  }
])

const inventoryValueChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    background: 'transparent',
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      borderRadius: 6
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (value: number) => {
      return formatRupiah(value)
    }
  },
  grid: {
    borderColor: '#27272a'
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (value: number) => formatRupiah(value)
    }
  },
  xaxis: {
    categories: inventoryValue.by_area.map((row: any) => row.warehouse_area || '-')
  },
  yaxis: {
    labels: {
      formatter: (value: number) => {
        if (value >= 1000000) {
          return `Rp ${(value / 1000000).toFixed(1)} jt`
        }

        return `Rp ${value.toLocaleString('id-ID')}`
      }
    }
  }
}))


const inventoryValueChartSeries = computed(() => [
  {
    name: 'Inventory Value',
    data: inventoryValue.by_area.map((row: any) => Number(row.inventory_value || 0))
  }
])

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}

async function fetchStockMovement() {
  loading.movement = true

  try {
    const res = await warehouseAnalyticsService.getStockMovement(filters)

    stockMovement.splice(0)
    stockMovement.push(...(res.data.data || []))
  } catch (error) {
    console.error('Error fetching stock movement:', error)
  } finally {
    loading.movement = false
  }
}

async function fetchInventoryValue() {
  loading.inventoryValue = true

  try {
    const res = await warehouseAnalyticsService.getInventoryValue(filters)

    console.log('Inventory Value Summary:', res.data.data?.summary)

    Object.assign(inventoryValue.summary, res.data.data?.summary || {})

    inventoryValue.by_area.splice(0)
    inventoryValue.by_area.push(...(res.data.data?.by_area || []))

    inventoryValue.by_category.splice(0)
    inventoryValue.by_category.push(...(res.data.data?.by_category || []))
  } catch (error) {
    console.error('Error fetching inventory value:', error)
  } finally {
    loading.inventoryValue = false
  }
}

onMounted(async () => {
  await Promise.all([
    fetchStockMovement(),
    fetchInventoryValue()
  ])

  if (isStaff.value) {
    fetchStaffTasks()
  }

  if (isSupervisor.value) {
    fetchApprovalItems()
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

        <p class="text-sm text-muted mt-1">
          Warehouse overview and operational insights.
        </p>
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

    <!-- Operational Queue -->
    <div v-if="isStaff" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
          <UIcon name="i-lucide-list-todo" class="w-4 h-4 text-primary" />
          Operational Queue
        </h2>

        <UBadge
          v-if="staffTasks.length"
          color="warning"
          variant="subtle"
          size="sm"
        >
          {{ staffTasks.length }} pending
        </UBadge>
      </div>

      <UCard>
        <!-- Loading -->
        <div v-if="staffTaskLoading" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
        </div>

        <!-- Empty -->
        <div v-else-if="!staffTasks.length" class="text-center py-8 text-muted">
          <UIcon name="i-lucide-check-circle" class="w-10 h-10 mx-auto mb-2 text-success" />
          <p class="text-sm font-medium">
            Operational queue is clear
          </p>
          <p class="text-xs mt-1">
            No pending warehouse operations.
          </p>
        </div>

        <!-- Rows -->
        <div v-else class="divide-y divide-default">
          <RouterLink
            v-for="item in staffTasks"
            :key="`${item.type}-${item.doc_number}`"
            :to="item.to"
            class="flex items-center gap-3 py-3 px-2 hover:bg-elevated rounded-lg transition-colors"
          >
            <UBadge
              :color=" item.type === 'Incoming' ? 'warning' : item.type === 'Placement' ? 'success' : 'secondary'"
              variant="subtle"
              size="xs"
              class="w-20 justify-center shrink-0"
            >
              {{ item.type }}
            </UBadge>

            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm truncate">
                {{ item.doc_number }}
              </div>

              <div class="text-xs text-muted truncate">
                {{ item.subtitle }}
              </div>
            </div>

            <div class="text-xs text-muted shrink-0">
              {{
                item.date
                  ? new Date(
                      item.date
                    ).toLocaleDateString()
                  : '-'
              }}
            </div>

            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted shrink-0" />
          </RouterLink>
        </div>
      </UCard>
    </div>

    <!-- Needs Approval -->
    <div v-if="isSupervisor" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
          <UIcon name="i-lucide-clipboard-check" class="w-4 h-4 text-warning" />
          Needs Approval
        </h2>

        <UBadge
          v-if="approvalItems.length"
          color="warning"
          variant="subtle"
          size="sm"
        >
          {{ approvalItems.length }} pending
        </UBadge>
      </div>

      <UCard>
        <!-- Loading -->
        <div v-if="approvalLoading" class="space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
        </div>

        <!-- Empty -->
        <div v-else-if="!approvalItems.length" class="text-center py-8 text-muted">
          <UIcon name="i-lucide-check-circle" class="w-10 h-10 mx-auto mb-2 text-success" />
          <p class="text-sm font-medium">
            All approved!
          </p>
          <p class="text-xs mt-1">
            No delivery orders pending approval.
          </p>
        </div>

        <!-- Rows -->
        <div v-else class="divide-y divide-default">
          <RouterLink
            v-for="item in approvalItems"
            :key="item.id"
            :to="item.to"
            class="flex items-center gap-3 py-3 px-2 hover:bg-elevated rounded-lg transition-colors"
          >
            <UBadge
              color="warning"
              variant="subtle"
              size="xs"
              class="w-24 justify-center shrink-0"
            >
              Waiting GR Approval
            </UBadge>

            <div class="flex-1 min-w-0">
              <div class="font-semibold text-sm truncate">
                {{ item.do_number }}
              </div>

              <div class="text-xs text-muted truncate">
                {{ item.supplier }}
              </div>
            </div>

            <div class="text-xs text-muted shrink-0">
              {{
                item.arrived_at
                  ? new Date(
                      item.arrived_at
                    ).toLocaleDateString()
                  : '-'
              }}
            </div>

            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-muted shrink-0" />
          </RouterLink>
        </div>
      </UCard>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-muted uppercase font-bold">
              Total Inventory Value
            </p>

            <h2 class="text-2xl font-black mt-2">
              {{ formatRupiah(totalInventoryValue) }}
            </h2>
          </div>

          <UIcon name="i-lucide-coins" class="w-8 h-8 text-primary" />
        </div>
      </UCard>
    </div>

    <!-- Analytics Preview -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Stock Movement Trend -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <UIcon name="i-lucide-trending-up" class="w-4 h-4 text-primary" />
              Stock Movement Trend
            </h2>

            <RouterLink
              to="/warehouse/analytics"
              class="text-xs text-primary font-semibold"
            >
              View Detail
            </RouterLink>
          </div>
        </template>

        <div v-if="loading.movement">
          <USkeleton class="h-64 w-full" />
        </div>

        <ClientOnly v-else>
          <apexchart
            v-if="stockMovement.length"
            type="line"
            height="280"
            :options="movementChartOptions"
            :series="movementChartSeries"
          />

          <div
            v-else
            class="h-64 flex items-center justify-center text-sm text-muted"
          >
            No stock movement data
          </div>
        </ClientOnly>
      </UCard>

      <!-- Inventory Value -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <UIcon name="i-lucide-banknote" class="w-4 h-4 text-success" />
              Inventory Value
            </h2>

            <RouterLink
              to="/warehouse/analytics"
              class="text-xs text-primary font-semibold"
            >
              View Detail
            </RouterLink>
          </div>
        </template>

        <div v-if="loading.inventoryValue">
          <USkeleton class="h-64 w-full" />
        </div>

        <ClientOnly v-else>
          <apexchart
            v-if="inventoryValue.by_area.length"
            type="bar"
            height="280"
            :options="inventoryValueChartOptions"
            :series="inventoryValueChartSeries"
          />

          <div
            v-else
            class="h-64 flex items-center justify-center text-sm text-muted"
          >
            No inventory value data
          </div>
        </ClientOnly>
      </UCard>
    </div>

    <!-- Quick Links -->
    <div class="space-y-4">
      <h2 class="text-sm font-bold text-default flex items-center gap-2 uppercase tracking-wider">
        <UIcon name="i-lucide-warehouse" class="w-4 h-4 text-success" />
        Warehouse Actions
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <RouterLink
          v-for="link in filteredQuickLinks"
          :key="link.title"
          :to="link.to"
        >
          <div class="bg-elevated border border-default hover:border-primary/50 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer group h-full">
            <UIcon
              :name="link.icon"
              class="w-6 h-6 text-muted-foreground group-hover:text-primary mb-3 transition-colors"
            />

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