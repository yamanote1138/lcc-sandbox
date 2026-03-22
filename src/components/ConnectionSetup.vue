<template>
  <div class="min-h-screen bg-neutral-950 text-white">
    <!-- Header -->
    <div class="sticky top-0 z-[1000] bg-neutral-950 shadow-md">
      <div class="px-4 py-2 sm:py-3 pb-2">
        <h1 class="text-lg font-semibold mb-1">LCC Sandbox</h1>
        <p class="text-neutral-400 text-sm mb-2 sm:mb-3">discover and control LCC devices via JMRI</p>
      </div>
      <hr class="border-white/10 m-0">
    </div>

    <!-- Setup Form -->
    <div class="px-4 pt-3">
      <div class="flex justify-center">
        <div class="w-full md:max-w-2xl lg:max-w-xl">
          <form @submit.prevent="handleConnect">
            <!-- Server Settings -->
            <div class="p-4 bg-white/5 rounded-md mb-4">
              <div class="mb-4">
                <label for="server" class="block text-sm font-medium mb-1">JMRI Server</label>
                <UInput
                  id="server"
                  v-model="serverAddress"
                  placeholder="raspi-jmri.local:12080"
                  :required="!settings.mockEnabled"
                  :disabled="settings.mockEnabled"
                  size="lg"
                />
                <small class="text-neutral-400 text-xs mt-1 block">
                  Host and port (e.g., raspi-jmri.local:12080 or 192.168.1.100:12080)
                </small>
              </div>
            </div>

            <!-- Secure -->
            <div class="mb-4">
              <UCheckbox id="secure" v-model="settings.secure" :disabled="settings.mockEnabled">
                <template #label>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-heroicons-shield-check" />
                    Secure Connection (WSS)
                  </span>
                </template>
              </UCheckbox>
              <small class="text-neutral-400 text-xs block ml-6 mt-1">
                Use encrypted WebSocket connection
              </small>
            </div>

            <!-- Demo Mode -->
            <div class="mb-4">
              <UCheckbox id="demo" v-model="settings.mockEnabled">
                <template #label>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-mdi-test-tube" />
                    Demo Mode
                  </span>
                </template>
              </UCheckbox>
              <small class="text-neutral-400 text-xs block ml-6 mt-1">
                No hardware required — uses simulated data
              </small>
            </div>

            <!-- Debug Logging -->
            <div class="mb-4">
              <UCheckbox id="debug" v-model="settings.debugEnabled">
                <template #label>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-mdi-bug" />
                    Enable Debug Logging
                  </span>
                </template>
              </UCheckbox>
              <small class="text-neutral-400 text-xs block ml-6 mt-1">
                Show detailed logs in console
              </small>
            </div>

            <!-- Remember Settings -->
            <div class="mb-6">
              <UCheckbox id="remember" v-model="rememberSettings">
                <template #label>
                  <span class="flex items-center gap-1">
                    <UIcon name="i-mdi-floppy" />
                    Remember these settings
                  </span>
                </template>
              </UCheckbox>
              <small class="text-neutral-400 text-xs block ml-6 mt-1">
                Save settings in browser for next time
              </small>
            </div>

            <!-- Error -->
            <UAlert
              v-if="errorMessage"
              color="error"
              icon="i-heroicons-exclamation-triangle"
              :title="errorMessage"
              class="mb-4"
            />

            <!-- Connect Button -->
            <UButton
              type="submit"
              color="success"
              size="xl"
              block
              :loading="isConnecting"
              :disabled="isConnecting"
            >
              <template v-if="!isConnecting" #leading>
                <UIcon name="i-mdi-power-plug" />
              </template>
              {{ isConnecting ? 'Connecting...' : 'Connect' }}
            </UButton>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { LccConnectionSettings } from '@/types/lcc'

const emit = defineEmits<{
  connect: [settings: LccConnectionSettings]
}>()

const settings = ref<LccConnectionSettings>({
  host: 'raspi-jmri.local',
  port: 12080,
  secure: false,
  mockEnabled: false,
  debugEnabled: false
})

const isConnecting = ref(false)
const errorMessage = ref('')
const rememberSettings = ref(false)

const serverAddress = computed({
  get: () => `${settings.value.host}:${settings.value.port}`,
  set: (value: string) => {
    const parts = value.split(':')
    if (parts.length >= 1) {
      settings.value.host = parts[0].trim()
    }
    if (parts.length >= 2) {
      const port = parseInt(parts[1].trim())
      if (!isNaN(port) && port > 0 && port <= 65535) {
        settings.value.port = port
      }
    }
  }
})

onMounted(() => {
  const saved = localStorage.getItem('lcc-connection-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      settings.value = { ...settings.value, ...parsed }
      rememberSettings.value = true
    } catch (error) {
      console.error('Failed to parse saved settings:', error)
    }
  }
})

const handleConnect = () => {
  errorMessage.value = ''
  isConnecting.value = true

  const parts = serverAddress.value.split(':')
  if (parts.length < 2) {
    settings.value.port = 12080
  }

  if (rememberSettings.value) {
    localStorage.setItem('lcc-connection-settings', JSON.stringify(settings.value))
  } else {
    localStorage.removeItem('lcc-connection-settings')
  }

  localStorage.setItem('jmri-debug-enabled', settings.value.debugEnabled ? 'true' : 'false')

  emit('connect', settings.value)
}

defineExpose({
  setError: (message: string) => {
    console.error('Connection error:', message)
    errorMessage.value = message
    isConnecting.value = false
  },
  setConnecting: (connecting: boolean) => {
    isConnecting.value = connecting
  }
})
</script>
