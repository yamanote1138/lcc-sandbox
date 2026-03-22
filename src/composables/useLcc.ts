/**
 * LCC control composable
 * Handles connection and control of LCC devices via JMRI
 */

import { ref, computed } from 'vue'
import { logger } from '@/utils/logger'
import type { SensorItem, LightItem, LccConnectionSettings } from '@/types/lcc'

import { ExtendedJmriClient, LightState } from '@/jmri-ext'

// Connection state enum
export enum ConnectionState {
  UNKNOWN = 'unknown',
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected'
}

// Singleton state
const sensors = ref<Map<string, SensorItem>>(new Map())
const lights = ref<Map<string, LightItem>>(new Map())
const connectionState = ref<ConnectionState>(ConnectionState.DISCONNECTED)
const railroadName = ref<string>('LCC Sandbox')
const jmriVersion = ref<string>('')
let jmriClient: any = null
let currentSettings: LccConnectionSettings | null = null

/**
 * Main LCC composable
 */
export function useLcc() {
  /**
   * Initialize JMRI client with connection settings
   */
  const initialize = (settings: LccConnectionSettings) => {
    if (jmriClient) {
      logger.warn('JMRI client already initialized, disconnecting first')
      disconnect()
    }

    currentSettings = settings
    const protocol = settings.secure ? 'wss' : 'ws'
    logger.debug('Initializing JMRI client:', `${protocol}://${settings.host}:${settings.port}/json`)
    logger.debug('Mock mode enabled:', settings.mockEnabled)

    jmriClient = new ExtendedJmriClient({
      host: settings.host,
      port: settings.port,
      protocol,
      autoConnect: false,
      mock: {
        enabled: settings.mockEnabled,
        responseDelay: 50
      },
      reconnection: {
        enabled: true,
        maxAttempts: 0,
        initialDelay: 1000,
        maxDelay: 30000,
        multiplier: 1.5,
        jitter: true
      },
      heartbeat: {
        enabled: !settings.mockEnabled,
        interval: 15000,
        timeout: 5000
      }
    })

    // Connection events
    jmriClient.on('connected', async () => {
      logger.info('Connected to JMRI')
      connectionState.value = ConnectionState.CONNECTED

      try {
        await fetchSensors()
      } catch (error) {
        logger.error('Failed to fetch sensors on connect:', error)
      }

      try {
        await fetchLights()
      } catch (error) {
        logger.error('Failed to fetch lights on connect:', error)
      }
    })

    jmriClient.on('hello', (data: any) => {
      if (data?.railroad) {
        railroadName.value = data.railroad
        logger.info('Railroad name:', railroadName.value)
      }
      if (data?.JMRI) {
        jmriVersion.value = data.JMRI
        logger.info('JMRI version:', jmriVersion.value)
      }
    })

    jmriClient.on('disconnected', (reason: any) => {
      logger.warn('Disconnected:', reason)
      connectionState.value = ConnectionState.UNKNOWN
    })

    jmriClient.on('reconnecting', (attempt: number, delay: number) => {
      logger.info(`Reconnecting (attempt ${attempt}, delay ${delay}ms)`)
      connectionState.value = ConnectionState.UNKNOWN
    })

    jmriClient.on('reconnected', () => {
      logger.info('Reconnected')
      connectionState.value = ConnectionState.CONNECTED
    })

    jmriClient.on('error', (error: any) => {
      logger.error('JMRI client error:', error)
    })

    jmriClient.on('heartbeat:timeout', () => {
      logger.warn('Heartbeat timeout')
      connectionState.value = ConnectionState.UNKNOWN
    })

    // Device state change events
    jmriClient.on('sensor:changed', (name: string, state: any) => {
      logger.info(`Sensor ${name} changed to`, state === 2 ? 'ACTIVE' : state === 4 ? 'INACTIVE' : 'UNKNOWN')
      const existing = sensors.value.get(name)
      if (existing) {
        sensors.value.set(name, { ...existing, state })
      } else {
        sensors.value.set(name, { name, state })
      }
    })

    jmriClient.on('light:changed', (name: string, state: any) => {
      logger.info(`Light ${name} changed to`, state === 2 ? 'ON' : state === 4 ? 'OFF' : 'UNKNOWN')
      const existing = lights.value.get(name)
      if (existing) {
        lights.value.set(name, { ...existing, state })
      } else {
        lights.value.set(name, { name, state })
      }
    })

    // Connect
    jmriClient.connect()
  }

  /**
   * Fetch all sensors from JMRI
   */
  async function fetchSensors() {
    if (!jmriClient || connectionState.value !== ConnectionState.CONNECTED) {
      logger.error('Cannot fetch sensors: not connected')
      return
    }

    try {
      logger.info('Fetching sensors')
      const sensorList = await jmriClient.listSensors()

      for (const sensor of sensorList) {
        sensors.value.set(sensor.name, {
          name: sensor.name,
          userName: sensor.userName,
          state: sensor.state ?? 0
        })
        // Subscribe to push updates for each sensor
        jmriClient.getSensor(sensor.name).catch((e: any) =>
          logger.warn(`Failed to subscribe to sensor ${sensor.name}:`, e)
        )
      }

      logger.info(`Loaded ${sensorList.length} sensors`)
    } catch (error) {
      logger.error('Failed to fetch sensors:', error)
      throw error
    }
  }

  /**
   * Fetch all lights from JMRI
   */
  async function fetchLights() {
    if (!jmriClient || connectionState.value !== ConnectionState.CONNECTED) {
      logger.error('Cannot fetch lights: not connected')
      return
    }

    try {
      logger.info('Fetching lights')
      const lightList = await jmriClient.listLights()

      for (const light of lightList) {
        lights.value.set(light.name, {
          name: light.name,
          userName: light.userName,
          state: light.state ?? 0
        })
        // Subscribe to push updates for each light
        jmriClient.getLight(light.name).catch((e: any) =>
          logger.warn(`Failed to subscribe to light ${light.name}:`, e)
        )
      }

      logger.info(`Loaded ${lightList.length} lights`)
    } catch (error) {
      logger.error('Failed to fetch lights:', error)
      throw error
    }
  }

  /**
   * Toggle a sensor (ACTIVE <-> INACTIVE)
   */
  async function toggleSensor(name: string) {
    if (!jmriClient || connectionState.value !== ConnectionState.CONNECTED) {
      logger.error('Cannot toggle sensor: not connected')
      return
    }

    const sensor = sensors.value.get(name)
    if (!sensor) {
      logger.error(`No sensor found: ${name}`)
      return
    }

    try {
      if (sensor.state === 2) { // SensorState.ACTIVE
        logger.info(`Deactivating ${name}`)
        await jmriClient.deactivateSensor(name)
      } else {
        logger.info(`Activating ${name}`)
        await jmriClient.activateSensor(name)
      }
    } catch (error) {
      logger.error(`Failed to toggle sensor ${name}:`, error)
      throw error
    }
  }

  /**
   * Toggle a light (ON <-> OFF)
   */
  async function toggleLight(name: string) {
    if (!jmriClient || connectionState.value !== ConnectionState.CONNECTED) {
      logger.error('Cannot toggle light: not connected')
      return
    }

    const light = lights.value.get(name)
    if (!light) {
      logger.error(`No light found: ${name}`)
      return
    }

    try {
      if (light.state === LightState.ON) {
        logger.info(`Turning off ${name}`)
        await jmriClient.turnLightOff(name)
      } else {
        logger.info(`Turning on ${name}`)
        await jmriClient.turnLightOn(name)
      }
    } catch (error) {
      logger.error(`Failed to toggle light ${name}:`, error)
      throw error
    }
  }

  /**
   * Disconnect and clean up
   */
  function disconnect() {
    if (!jmriClient) return

    logger.info('Disconnecting')

    try {
      jmriClient.disconnect()
    } catch (error) {
      logger.error('Error during disconnect:', error)
    }

    jmriClient = null
    currentSettings = null
    connectionState.value = ConnectionState.DISCONNECTED
    sensors.value.clear()
    lights.value.clear()
    railroadName.value = 'LCC Sandbox'
    jmriVersion.value = ''
  }

  return {
    // State
    sensors,
    lights,
    connectionState,
    railroadName,
    jmriVersion,

    // Computed
    isConnected: computed(() => connectionState.value === ConnectionState.CONNECTED),
    isMockMode: computed(() => currentSettings?.mockEnabled ?? false),
    sensorList: computed(() => Array.from(sensors.value.values())),
    lightList: computed(() => Array.from(lights.value.values())),

    // Methods
    initialize,
    disconnect,
    fetchSensors,
    fetchLights,
    toggleSensor,
    toggleLight
  }
}
