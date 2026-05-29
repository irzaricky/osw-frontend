<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import warehouseAnalyticsService from '../../services/warehouse/analytics.service'

const authStore = useAuthStore()
const router = useRouter()

const quickLinks = [
  { title: 'Placement', description: 'Place incoming goods', icon: 'i-lucide-package-plus', to: '/warehouse/placement' },
  { title: 'Take Out', description: 'Take goods from warehouse', icon: 'i-lucide-package-minus', to: '/warehouse/take-out' },
  { title: 'Transaction Activity', description: 'Warehouse transactions', icon: 'i-lucide-history', to: '/warehouse/transaction-activity' },
  { title: 'Stock Monitoring', description: 'Monitor stock levels', icon: 'i-lucide-boxes', to: '/warehouse/stock-monitoring' },
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

const totalStockQty = computed(() => {
  return Number(inventoryValue.summary?.total_stock_qty || 0)
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