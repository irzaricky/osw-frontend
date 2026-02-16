<script setup lang="ts">
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Warehouse">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="h-full flex items-center justify-center text-muted">
        Warehouse Mock Page
      </div>
    </template>
  </UDashboardPanel>
</template>
