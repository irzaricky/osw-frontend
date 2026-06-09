<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import DriverDashboard from './sales/sdo/DriverDashboard.vue'
import SalesDashboard from '../components/dashboard/SalesDashboard.vue'
import MaterialDashboard from '../components/dashboard/MaterialDashboard.vue'
import WarehouseDashboard from '../components/dashboard/WarehouseDashboard.vue'

const authStore = useAuthStore()
const isDriver = computed(() => authStore.user?.role?.toLowerCase() === 'driver')

const salesRoles = [
  'superadmin',
  'admin sales',
  'supervisor sales',
  'staff sales forecast',
  'staff sales order',
  'staff sales delivery'
]

const warehouseRoles = [
  'superadmin',
  'warehouse staff',
  'supervisor warehouse',
  'admin warehouse'
]

const ppicRoles = [
  'superadmin',
  'admin ppic',
  'staff ppic',
  'supervisor ppic'
]

const materialRoles = [
  'superadmin',
  'admin material',
  'staff material',
  'supervisor material',
  'foreman'
]

const isSalesModule = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  return role ? salesRoles.includes(role) : false
})

const isWarehouseModule = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  return role ? warehouseRoles.includes(role) : false
})

const isPpicModule = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  return role ? ppicRoles.includes(role) : false
})

const isMaterialModule = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  return role ? materialRoles.includes(role) : false
})
</script>

<template>
  <div v-if="isDriver" class="h-full w-full">
    <DriverDashboard />
  </div>
  <div v-else class="h-full">
    <UDashboardPanel id="home">
      <template #header>
        <UDashboardNavbar title="Home">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>
      <!-- Dashboard Content -->
      <template #body>
        <div class="bg-muted/10 p-0 h-full overflow-y-auto">
          <SalesDashboard v-if="isSalesModule" />
          <WarehouseDashboard v-if="isWarehouseModule" />
          <MaterialDashboard v-if="isMaterialModule" />
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
