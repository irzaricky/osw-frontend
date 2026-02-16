<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStorage } from '@vueuse/core'
import DefaultLayout from './layouts/DefaultLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'

const toast = useToast()
const route = useRoute()

const layouts = {
  default: DefaultLayout,
  auth: AuthLayout
}

const layout = computed(() => {
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
    <UApp :toaster="{ position: 'bottom-right', duration: 4000 }">
      <component :is="layout">
        <RouterView />
      </component>
    </UApp>
  </Suspense>
</template>

