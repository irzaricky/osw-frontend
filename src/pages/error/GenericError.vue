<script setup lang="ts">
const error = {
  statusCode: 500,
  statusMessage: 'Internal Server Error',
  message: 'Something went wrong.'
}
</script>

<template>
  <UDashboardPanel>
    <UError :error="error" />
  </UDashboardPanel>
</template>
