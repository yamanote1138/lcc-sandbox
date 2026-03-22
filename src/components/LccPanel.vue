<template>
  <div class="space-y-6">
    <!-- Push Buttons (Sensors) -->
    <div>
      <h2 class="text-base font-semibold mb-3">
        <UIcon name="i-mdi-gesture-tap-button" class="mr-1" />
        Push Buttons
        <span class="text-neutral-400 text-sm font-normal">({{ lccSensors.length }})</span>
      </h2>

      <div v-if="lccSensors.length === 0" class="text-neutral-500 text-sm py-4 text-center">
        No LCC sensors found
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <button
          v-for="sensor in lccSensors"
          :key="sensor.name"
          class="flex flex-col items-center p-4 bg-white/5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          @click="toggleSensor(sensor.name)"
        >
          <div
            class="w-10 h-10 rounded-full mb-2 transition-colors"
            :class="sensorIndicatorClass(sensor.state)"
          />
          <div class="text-sm font-medium text-center">
            {{ sensor.userName || sensor.name }}
          </div>
          <div v-if="sensor.userName" class="text-xs text-neutral-600 truncate max-w-full" :title="sensor.name">
            {{ sensor.name }}
          </div>
          <div class="text-xs text-neutral-500 mt-1">
            {{ sensorStateLabel(sensor.state) }}
          </div>
          <div class="text-xs text-neutral-600 mt-1">tap to toggle</div>
        </button>
      </div>
    </div>

    <!-- LEDs (Lights) -->
    <div>
      <h2 class="text-base font-semibold mb-3">
        <UIcon name="i-mdi-led-on" class="mr-1" />
        LEDs
        <span class="text-neutral-400 text-sm font-normal">({{ lccLights.length }})</span>
      </h2>

      <div v-if="lccLights.length === 0" class="text-neutral-500 text-sm py-4 text-center">
        No LCC lights configured yet
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <div
          v-for="light in lccLights"
          :key="light.name"
          class="flex flex-col items-center p-4 bg-white/5 rounded-md"
        >
          <div
            class="w-10 h-10 rounded-full mb-2 transition-colors"
            :class="lightIndicatorClass(light.state)"
          />
          <div class="text-sm font-medium text-center">
            {{ light.userName || light.name }}
          </div>
          <div v-if="light.userName" class="text-xs text-neutral-600 truncate max-w-full" :title="light.name">
            {{ light.name }}
          </div>
          <div class="text-xs text-neutral-500 mt-1">
            {{ lightStateLabel(light.state) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLcc } from '@/composables/useLcc'

const { sensorList, lightList, toggleSensor } = useLcc()

// Filter out JMRI internal sensors (IS* prefix)
const lccSensors = computed(() =>
  sensorList.value.filter(s => !s.name.startsWith('IS'))
)

const lccLights = computed(() => lightList.value)

function sensorStateLabel(state: number): string {
  switch (state) {
    case 2: return 'ACTIVE'
    case 4: return 'INACTIVE'
    default: return 'UNKNOWN'
  }
}

function lightStateLabel(state: number): string {
  switch (state) {
    case 2: return 'ON'
    case 4: return 'OFF'
    default: return 'UNKNOWN'
  }
}

function sensorIndicatorClass(state: number): string {
  switch (state) {
    case 2: return 'bg-green-500 shadow-lg shadow-green-500/50'
    case 4: return 'bg-neutral-600'
    default: return 'bg-neutral-700 opacity-50'
  }
}

function lightIndicatorClass(state: number): string {
  switch (state) {
    case 2: return 'bg-amber-400 shadow-lg shadow-amber-400/50'
    case 4: return 'bg-neutral-600'
    default: return 'bg-neutral-700 opacity-50'
  }
}
</script>
