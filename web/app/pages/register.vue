<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: false })

const toast = useToast()
const { data: signupState } = await useFetch('/api/auth/signup-open')

if (signupState.value && !signupState.value.isOpen) {
  await navigateTo('/login')
}

const schema = z.object({
  name: z.string().min(2, 'Must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
})

type Schema = z.output<typeof schema>

function getAuthErrorMessage(error: any) {
  return error?.message || 'Unable to create account.'
}

async function handleRegister(event: FormSubmitEvent<Schema>) {
  const result = await authClient.signUp.email({
    name: event.data.name,
    email: event.data.email,
    password: event.data.password,
  })

  if (result.error) {
    toast.add({
      title: 'Registration failed',
      description: getAuthErrorMessage(result.error),
      color: 'error',
    })
    return
  }

  // Refresh session state so the middleware sees authenticated: true immediately
  await useAuthSession().fetch()

  await navigateTo('/app')
}

const fields = ref<AuthFormField[]>([
  {
    name: 'name',
    type: 'text',
    label: 'Name',
  },
  {
    name: 'email',
    type: 'text',
    label: 'Email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
  },
])

function onSubmit(payload: FormSubmitEvent<Schema>) {
  handleRegister({
    ...payload,
  })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-950">
    <UCard>

    
    <UAuthForm
      v-if="signupState && signupState.isOpen"
      title="Create initial account"
      description="Single-user setup: registration closes after first account"
      :fields="fields"
      class="max-w-md"
      @submit="onSubmit"
    />

    <div v-else class="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
      <p class="text-sm text-gray-600 dark:text-gray-300">Registration is closed.</p>
      <UButton to="/login" label="Go to sign in" class="mt-4" />
    </div>
</UCard>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Already set up?
      <NuxtLink to="/login" class="text-primary-600 dark:text-primary-400 underline">Sign in</NuxtLink>
    </p>
  </div>
</template>
