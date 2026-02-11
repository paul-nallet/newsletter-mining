<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

definePageMeta({ layout: false })

const route = useRoute()
const toast = useToast()
const signingInWithGoogle = ref(false)
const runtimeConfig = useRuntimeConfig()
const isGoogleAuthEnabled = computed(() => runtimeConfig.public.googleAuthEnabled === 'true')

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  remember: z.boolean().optional(),
})

type Schema = z.output<typeof schema>

function getAuthErrorMessage(error: any) {
  return error?.message || 'Unable to sign in.'
}

async function handleLogin(event: FormSubmitEvent<Schema>) {
  const result = await authClient.signIn.email({
    email: event.data.email,
    password: event.data.password,
  })

  if (result.error) {
    toast.add({
      title: 'Login failed',
      description: getAuthErrorMessage(result.error),
      color: 'error',
    })
    return
  }

  // Refresh session state so the middleware sees authenticated: true immediately
  await useAuthSession().fetch()

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/app'
  await navigateTo(redirect)
}

async function signInWithGoogle() {
  signingInWithGoogle.value = true
  const callbackURL = typeof route.query.redirect === 'string' ? route.query.redirect : '/app'

  try {
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL,
      errorCallbackURL: '/login',
    })

    if (result.error) {
      toast.add({
        title: 'Google login failed',
        description: getAuthErrorMessage(result.error),
        color: 'error',
      })
    }
  }
  finally {
    signingInWithGoogle.value = false
  }
}

const providers = computed<ButtonProps[]>(() => {
  if (!isGoogleAuthEnabled.value) return []

  return [{
    label: 'Continue with Google',
    icon: 'i-lucide-chrome',
    color: 'neutral',
    variant: 'soft',
    loading: signingInWithGoogle.value,
    disabled: signingInWithGoogle.value,
    onClick: signInWithGoogle,
  }]
})

const fields = ref<AuthFormField[]>([
  {
    name: 'email',
    type: 'text',
    label: 'Email'
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password'
  }
])

function onSubmit(payload: FormSubmitEvent<Schema>) {
  handleLogin({
    ...payload,
    }
  )
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 p-4 bg-gray-50 dark:bg-gray-950">

  <UCard>
  
  <UAuthForm
    title="Login"
    description="Enter your credentials to access your account."
    :fields="fields"
    :providers="providers"
    class="max-w-md"
    @submit="onSubmit"
  />
</UCard>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Don't have an account?
      <NuxtLink to="/register" class="text-primary-600 dark:text-primary-400 underline">Sign up</NuxtLink>
    </p>
  </div>
</template>
