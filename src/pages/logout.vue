<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.store'

const authStore = useAuthStore()

onMounted(() => {
  authStore.logout()
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin" />
    <span class="ml-2">Logging out...</span>
  </div>
</template>
