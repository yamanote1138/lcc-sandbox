<template>
  <div class="space-y-4">
    <!-- Push Buttons -->
    <div>
      <h2 class="text-sm font-semibold mb-2 text-neutral-400">Push Buttons</h2>
      <div v-if="lccSensors.length === 0" class="text-neutral-500 text-xs py-2 text-center">
        No sensors
      </div>
      <div v-else class="grid grid-cols-3 gap-2">
        <button
          v-for="sensor in lccSensors"
          :key="sensor.name"
          class="flex flex-col items-center py-3 px-2 bg-white/5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          @click="toggleSensor(sensor.name)"
        >
          <div
            class="w-6 h-6 rounded-full mb-1.5 transition-colors"
            :class="sensorIndicatorClass(sensor.state)"
          />
          <div class="text-xs font-medium text-center leading-tight">
            {{ sensor.userName || sensor.name }}
          </div>
        </button>
      </div>
    </div>

    <!-- LEDs -->
    <div>
      <h2 class="text-sm font-semibold mb-2 text-neutral-400">LEDs</h2>
      <div v-if="lccLights.length === 0" class="text-neutral-500 text-xs py-2 text-center">
        No lights
      </div>
      <div v-else class="grid grid-cols-3 gap-2">
        <div
          v-for="light in lccLights"
          :key="light.name"
          class="flex flex-col items-center py-3 px-2 bg-white/5 rounded-md"
        >
          <div
            class="w-6 h-6 rounded-full mb-1.5 transition-colors"
            :class="lightIndicatorClass(light.state)"
          />
          <div class="text-xs font-medium text-center leading-tight">
            {{ light.userName || light.name }}
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

const lccSensors = computed(() =>
  sensorList.value
    .filter(s => !s.name.startsWith('IS'))
    .sort((a, b) => (a.userName || a.name).localeCompare(b.userName || b.name))
)

const lccLights = computed(() =>
  lightList.value
    .sort((a, b) => (a.userName || a.name).localeCompare(b.userName || b.name))
)

function sensorIndicatorClass(state: number): string {
  switch (state) {
    case 2: return 'bg-green-500 shadow-md shadow-green-500/50'
    case 4: return 'bg-neutral-600'
    default: return 'bg-neutral-700 opacity-50'
  }
}

function lightIndicatorClass(state: number): string {
  switch (state) {
    case 2: return 'bg-amber-400 shadow-md shadow-amber-400/50'
    case 4: return 'bg-neutral-600'
    default: return 'bg-neutral-700 opacity-50'
  }
}
</script>
