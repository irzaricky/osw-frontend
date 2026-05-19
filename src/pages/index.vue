<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import DriverDashboard from './sales/sdo/DriverDashboard.vue'

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
    </UDashboardPanel>
  </div>
</template>
