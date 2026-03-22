/**
 * Sensor manager — extends jmri-client with sensor support
 */

import { EventEmitter } from 'events'
import type { WebSocketClient } from 'jmri-client'
import { SensorState, type SensorData, type SensorMessage } from './types'

export class SensorManager extends EventEmitter {
  private client: WebSocketClient
  private sensors: Map<string, SensorState> = new Map()

  constructor(client: WebSocketClient) {
    super()
    this.client = client

    this.client.on('update', (message: any) => {
      if (message.type === 'sensor') {
        this.handleSensorUpdate(message)
      }
    })
  }

  async getSensor(name: string): Promise<SensorState> {
    const message: SensorMessage = { type: 'sensor', data: { name } }
    const response = await (this.client as any).request<SensorMessage>(message)
    const state = response.data?.state ?? SensorState.UNKNOWN
    this.sensors.set(name, state)
    return state
  }

  async setSensor(name: string, state: SensorState): Promise<void> {
    const message: SensorMessage = { type: 'sensor', method: 'post', data: { name, state } }
    await (this.client as any).request<SensorMessage>(message)
    const oldState = this.sensors.get(name)
    this.sensors.set(name, state)
    if (oldState !== state) {
      this.emit('sensor:changed', name, state)
    }
  }

  async activateSensor(name: string): Promise<void> {
    return this.setSensor(name, SensorState.ACTIVE)
  }

  async deactivateSensor(name: string): Promise<void> {
    return this.setSensor(name, SensorState.INACTIVE)
  }

  async listSensors(): Promise<SensorData[]> {
    const message: SensorMessage = { type: 'sensor', method: 'list' }
    const response = await (this.client as any).request<any>(message)
    const entries: SensorData[] = Array.isArray(response?.data)
      ? response.data.map((r: any) => r.data ?? r)
      : []
    for (const entry of entries) {
      if (entry.name && entry.state !== undefined) {
        this.sensors.set(entry.name, entry.state)
      }
    }
    return entries
  }

  getSensorState(name: string): SensorState | undefined {
    return this.sensors.get(name)
  }

  getCachedSensors(): Map<string, SensorState> {
    return new Map(this.sensors)
  }

  private handleSensorUpdate(message: SensorMessage): void {
    const name = message.data?.name
    const state = message.data?.state
    if (!name || state === undefined) return
    const oldState = this.sensors.get(name)
    this.sensors.set(name, state)
    if (oldState !== state) {
      this.emit('sensor:changed', name, state)
    }
  }
}
