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
          <div v-else class="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden select-none">
            <!-- Ambient Glow Background Effects -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
            <div class="absolute top-[40%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-success/5 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>

            <div class="z-10 flex flex-col items-center max-w-lg space-y-6">
              <div class="flex items-center justify-center w-20 h-20 bg-primary/10 border border-primary/20 rounded-full shadow-inner">
                <UIcon name="i-lucide-house" class="w-9 h-9 text-primary" />
              </div>
              
              <div class="space-y-2">
                <h1 class="text-4xl md:text-5xl font-black tracking-tight text-default bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-transparent">
                  OSW System
                </h1>
                <p class="text-xs font-bold tracking-wider uppercase text-primary/80">
                  Subsystem Portal
                </p>
              </div>

              <div class="w-12 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

              <div class="space-y-1">
                <p class="text-base text-default">
                  Hello, <span class="font-bold text-primary">{{ authStore.user?.email }}</span>
                </p>
                <p class="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  You are authorized with the role of <span class="font-semibold text-default">{{ authStore.user?.role }}</span>. Please use the navigation sidebar to access your workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
