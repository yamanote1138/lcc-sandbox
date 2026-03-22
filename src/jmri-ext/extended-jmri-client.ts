/**
 * ExtendedJmriClient — adds Sensor and Light support to JmriClient
 *
 * Uses the protected wsClient from jmri-client v4 to wire up
 * additional managers without modifying the base library.
 */

import { JmriClient } from 'jmri-client'
import type { PartialClientOptions } from 'jmri-client'
import { SensorManager } from './sensor-manager'
import { LightManager } from './light-manager'
import { SensorState, LightState } from './types'
import type { SensorData, LightData } from './types'

export class ExtendedJmriClient extends JmriClient {
  private sensorManager: SensorManager
  private lightManager: LightManager

  constructor(options?: PartialClientOptions) {
    super(options)

    this.sensorManager = new SensorManager(this.wsClient as any)
    this.lightManager = new LightManager(this.wsClient as any)

    // Forward events
    this.sensorManager.on('sensor:changed', (name: string, state: SensorState) =>
      this.emit('sensor:changed', name, state)
    )
    this.lightManager.on('light:changed', (name: string, state: LightState) =>
      this.emit('light:changed', name, state)
    )
  }

  // Sensor methods
  async getSensor(name: string): Promise<SensorState> {
    return this.sensorManager.getSensor(name)
  }

  async setSensor(name: string, state: SensorState): Promise<void> {
    return this.sensorManager.setSensor(name, state)
  }

  async activateSensor(name: string): Promise<void> {
    return this.sensorManager.activateSensor(name)
  }

  async deactivateSensor(name: string): Promise<void> {
    return this.sensorManager.deactivateSensor(name)
  }

  async listSensors(): Promise<SensorData[]> {
    return this.sensorManager.listSensors()
  }

  getSensorState(name: string): SensorState | undefined {
    return this.sensorManager.getSensorState(name)
  }

  getCachedSensors(): Map<string, SensorState> {
    return this.sensorManager.getCachedSensors()
  }

  // Light methods
  async getLight(name: string): Promise<LightState> {
    return this.lightManager.getLight(name)
  }

  async setLight(name: string, state: LightState): Promise<void> {
    return this.lightManager.setLight(name, state)
  }

  async turnLightOn(name: string): Promise<void> {
    return this.lightManager.turnLightOn(name)
  }

  async turnLightOff(name: string): Promise<void> {
    return this.lightManager.turnLightOff(name)
  }

  async listLights(): Promise<LightData[]> {
    return this.lightManager.listLights()
  }

  getLightState(name: string): LightState | undefined {
    return this.lightManager.getLightState(name)
  }

  getCachedLights(): Map<string, LightState> {
    return this.lightManager.getCachedLights()
  }
}
