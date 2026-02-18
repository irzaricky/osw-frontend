<script setup lang="ts">
import { z } from 'zod'
import { useAuthStore } from '../stores/auth.store'
import type { FormSubmitEvent } from '@nuxt/ui'

const authStore = useAuthStore()
const toast = useToast()

const fields = [{
  name: 'username',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email or username',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox'
}]

const schema = z.object({
  username: z.string({ message: 'Email is required' }).min(1, 'Email is required').email('Invalid email'),
  password: z.string({ message: 'Password is required' }).min(1, 'Password is required'),
  remember: z.boolean().default(false)
})

type Schema = z.output<typeof schema>

const onSubmit = async (event?: FormSubmitEvent<any>) => {
  if (!event) return

  try {
    await authStore.login(event.data as Schema)
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Login Failed',
      description: authStore.error || 'Please check your credentials',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 w-full">
    <UPageCard class="w-full max-w-md bg-white/75 dark:bg-white/5 backdrop-blur">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        title="Welcome back!"
        icon="i-lucide-lock"
        :loading="authStore.loading"
        @submit="onSubmit"
      >
        <template #description>
          Sign in to your account to access the dashboard.
        </template>
        
        <template #password-hint>
          <ULink to="#" class="text-primary font-medium" tabindex="-1">Forgot password?</ULink>
        </template>
        
        <template #validation>
           <UAlert 
             v-if="authStore.error"
             color="error" 
             icon="i-lucide-info" 
             :title="authStore.error" 
             class="mb-4"
           />
        </template>

        <template #footer>
          By signing in, you agree to our <ULink to="#" class="text-primary font-medium">Terms of Service</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
