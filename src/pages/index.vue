<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import DriverDashboard from './sales/sdo/DriverDashboard.vue'
import SalesDashboard from '../components/dashboard/SalesDashboard.vue'

const authStore = useAuthStore()
const isDriver = computed(() => authStore.user?.role?.toLowerCase() === 'driver')
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
          <SalesDashboard />
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
