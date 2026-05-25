<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'
import DriverLayout from './layouts/DriverLayout.vue'
import { useAuthStore } from './stores/auth.store'

const toast = useToast()
const route = useRoute()
const authStore = useAuthStore()

const isDriver = computed(() => authStore.user?.role?.toLowerCase() === 'driver')

const layouts = {
  default: DefaultLayout,
  auth: AuthLayout,
  driver: DriverLayout
}

const layout = computed(() => {
  if (route.meta.layout === 'auth') {
    return AuthLayout
  }
  if (isDriver.value) {
    return DriverLayout
  }
  return layouts[route.meta.layout as keyof typeof layouts] || DefaultLayout
})

const cookie = useStorage('cookie-consent', 'pending')
if (cookie.value !== 'accepted') {
  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
}
</script>

<template>
  <Suspense>
    <UApp :toaster="{ position: 'bottom-right', duration: 3000, max:3 }">
      <component :is="layout">
        <RouterView />
      </component>
    </UApp>
  </Suspense>
</template>

