<template>
  <div class="space-y-6">
    <!-- Sensors Section -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold">
          <UIcon name="i-mdi-access-point" class="mr-1" />
          Sensors
          <span class="text-neutral-400 text-sm font-normal">({{ sensorList.length }})</span>
        </h2>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-mdi-refresh"
          @click="fetchSensors"
          :loading="refreshingSensors"
        >
          Refresh
        </UButton>
      </div>

      <div v-if="sensorList.length === 0" class="text-neutral-500 text-sm py-4 text-center">
        No sensors found
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="sensor in sensorList"
          :key="sensor.name"
          class="flex items-center justify-between p-3 bg-white/5 rounded-md"
        >
          <div class="min-w-0 flex-1 mr-3">
            <div class="font-medium text-sm truncate" :title="sensor.name">
              {{ sensor.userName || sensor.name }}
            </div>
            <div v-if="sensor.userName" class="text-neutral-500 text-xs truncate" :title="sensor.name">
              {{ sensor.name }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              :color="sensorBadgeColor(sensor.state)"
              variant="subtle"
              size="sm"
            >
              {{ sensorStateLabel(sensor.state) }}
            </UBadge>
            <UButton
              size="xs"
              :color="sensor.state === 2 ? 'warning' : 'success'"
              variant="soft"
              @click="toggleSensor(sensor.name)"
            >
              {{ sensor.state === 2 ? 'Deactivate' : 'Activate' }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Lights Section -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold">
          <UIcon name="i-mdi-lightbulb-outline" class="mr-1" />
          Lights
          <span class="text-neutral-400 text-sm font-normal">({{ lightList.length }})</span>
        </h2>
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-mdi-refresh"
          @click="fetchLights"
          :loading="refreshingLights"
        >
          Refresh
        </UButton>
      </div>

      <div v-if="lightList.length === 0" class="text-neutral-500 text-sm py-4 text-center">
        No lights found
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="light in lightList"
          :key="light.name"
          class="flex items-center justify-between p-3 bg-white/5 rounded-md"
        >
          <div class="min-w-0 flex-1 mr-3">
            <div class="font-medium text-sm truncate" :title="light.name">
              {{ light.userName || light.name }}
            </div>
            <div v-if="light.userName" class="text-neutral-500 text-xs truncate" :title="light.name">
              {{ light.name }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UBadge
              :color="lightBadgeColor(light.state)"
              variant="subtle"
              size="sm"
            >
              {{ lightStateLabel(light.state) }}
            </UBadge>
            <UButton
              size="xs"
              :color="light.state === 2 ? 'warning' : 'success'"
              variant="soft"
              @click="toggleLight(light.name)"
            >
              {{ light.state === 2 ? 'Turn Off' : 'Turn On' }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLcc } from '@/composables/useLcc'

const { sensorList, lightList, fetchSensors: doFetchSensors, fetchLights: doFetchLights, toggleSensor, toggleLight } = useLcc()

const refreshingSensors = ref(false)
const refreshingLights = ref(false)

async function fetchSensors() {
  refreshingSensors.value = true
  try {
    await doFetchSensors()
  } finally {
    refreshingSensors.value = false
  }
}

async function fetchLights() {
  refreshingLights.value = true
  try {
    await doFetchLights()
  } finally {
    refreshingLights.value = false
  }
}

function sensorStateLabel(state: number): string {
  switch (state) {
    case 2: return 'ACTIVE'
    case 4: return 'INACTIVE'
    default: return 'UNKNOWN'
  }
}

function sensorBadgeColor(state: number): 'success' | 'neutral' | 'warning' {
  switch (state) {
    case 2: return 'success'
    case 4: return 'neutral'
    default: return 'warning'
  }
}

function lightStateLabel(state: number): string {
  switch (state) {
    case 2: return 'ON'
    case 4: return 'OFF'
    default: return 'UNKNOWN'
  }
}

function lightBadgeColor(state: number): 'success' | 'neutral' | 'warning' {
  switch (state) {
    case 2: return 'success'
    case 4: return 'neutral'
    default: return 'warning'
  }
}
</script>
