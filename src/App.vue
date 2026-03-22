<template>
  <!-- Connection Setup Screen -->
  <ConnectionSetup
    v-if="!isInitialized"
    ref="setupRef"
    @connect="handleConnect"
  />

  <!-- Main Application -->
  <div v-else class="min-h-screen bg-neutral-950 text-white">
    <!-- Sticky Header -->
    <div class="sticky top-0 z-[1000] bg-neutral-950 header-shadow">
      <div class="px-4 py-2 sm:py-3 pb-2">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-semibold">{{ railroadName }}</h1>
            <p class="text-neutral-400 text-sm">{{ connectionSubtitle }}</p>
          </div>
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-mdi-power-plug-off"
            @click="handleDisconnect"
          >
            Disconnect
          </UButton>
        </div>
      </div>
      <hr class="border-white/10 m-0">

      <!-- Tab Navigation -->
      <div class="flex gap-2 px-3 py-2 border-b border-white/10">
        <button
          class="text-sm py-1 px-3 rounded-full transition-colors"
          :class="activeTab === 'discovery' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white/80'"
          @click="activeTab = 'discovery'"
        >
          <UIcon name="i-mdi-magnify" /> Discovery
        </button>
        <button
          class="text-sm py-1 px-3 rounded-full transition-colors"
          :class="activeTab === 'lcc' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white/80'"
          @click="activeTab = 'lcc'"
        >
          <UIcon name="i-mdi-chip" /> LCC Panel
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 pt-2 sm:pt-3 pb-6">
      <DiscoveryPanel v-show="activeTab === 'discovery'" />
      <LccPanel v-show="activeTab === 'lcc'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLcc, ConnectionState } from '@/composables/useLcc'
import { logger } from '@/utils/logger'
import type { LccConnectionSettings } from '@/types/lcc'
import ConnectionSetup from '@/components/ConnectionSetup.vue'
import DiscoveryPanel from '@/components/DiscoveryPanel.vue'
import LccPanel from '@/components/LccPanel.vue'

const { initialize, disconnect, isConnected, connectionState, railroadName, jmriVersion, isMockMode } = useLcc()

const isInitialized = ref(false)
const activeTab = ref<'discovery' | 'lcc'>('discovery')
const setupRef = ref<InstanceType<typeof ConnectionSetup>>()
const connectionHost = ref('')

const connectionSubtitle = computed(() => {
  const parts = [
    isMockMode.value ? 'mock data' : connectionHost.value,
    jmriVersion.value ? `JMRI ${jmriVersion.value}` : ''
  ]
  return parts.filter(Boolean).join(' | ')
})

watch(railroadName, (newName) => {
  document.title = `${newName} — LCC Sandbox`
}, { immediate: true })

const handleConnect = async (settings: LccConnectionSettings) => {
  try {
    logger.info('Connecting with settings:', settings)

    connectionHost.value = `${settings.host}:${settings.port}`

    initialize(settings)

    let connectionTimeout: NodeJS.Timeout | null = null
    let hasHandledError = false

    const handleConnectionError = (message: string) => {
      if (hasHandledError) return
      hasHandledError = true
      if (connectionTimeout) clearTimeout(connectionTimeout)
      setupRef.value?.setError(message)
      disconnect()
    }

    connectionTimeout = setTimeout(() => {
      if (!isConnected.value && !isInitialized.value) {
        logger.error('Connection timeout after 10 seconds')
        const protocol = settings.secure ? 'wss' : 'ws'
        handleConnectionError(
          `Connection timeout. Unable to reach ${protocol}://${settings.host}:${settings.port}. ` +
          `Check that the JMRI server is running and accessible.`
        )
      }
    }, 10000)

    const stopWatching = watch(connectionState, async (newState, oldState) => {
      if (newState === ConnectionState.CONNECTED) {
        if (connectionTimeout) clearTimeout(connectionTimeout)
        stopWatching()
        logger.info('Connected')
        isInitialized.value = true
      } else if (
        (newState === ConnectionState.DISCONNECTED || newState === ConnectionState.UNKNOWN) &&
        !isInitialized.value &&
        oldState !== undefined
      ) {
        const protocol = settings.secure ? 'wss' : 'ws'
        const url = `${protocol}://${settings.host}:${settings.port}`
        stopWatching()
        handleConnectionError(
          `Failed to connect to ${url}. ` +
          `Possible issues: hostname not found, port unreachable, or JMRI server not running.`
        )
      }
    })

  } catch (error: any) {
    logger.error('Failed to initialize:', error)
    setupRef.value?.setError(`Failed to connect: ${error.message || 'Unknown error'}`)
  }
}

const handleDisconnect = () => {
  logger.info('Disconnecting')
  disconnect()
  isInitialized.value = false
  document.title = 'LCC Sandbox'
}
</script>

<style scoped>
.header-shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
