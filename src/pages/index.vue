<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import DriverDashboard from './sales/sdo/DriverDashboard.vue'
import SalesDashboard from '../components/dashboard/SalesDashboard.vue'

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

const isSalesModule = computed(() => {
  const role = authStore.user?.role?.toLowerCase()
  return role ? salesRoles.includes(role) : false
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
          <div v-else class="h-full flex flex-col items-center justify-center text-center p-8 m-6">
            <div class="bg-elevated border border-default rounded-3xl p-12 max-w-md shadow-sm">
              <UIcon name="i-lucide-house" class="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 class="text-3xl font-black tracking-tight text-default">
                Welcome to OSW System
              </h1>
              <p class="text-sm text-muted-foreground mt-3 leading-relaxed">
                Hello, <span class="font-bold text-default">{{ authStore.user?.email }}</span>.
              </p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">
                You are logged in with the role of <span class="font-semibold text-default">{{ authStore.user?.role }}</span>. Please use the navigation sidebar to access your authorized modules.
              </p>
            </div>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
