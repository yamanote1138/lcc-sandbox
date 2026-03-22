/**
 * Light manager — extends jmri-client with light support
 */

import { EventEmitter } from 'events'
import type { WebSocketClient } from 'jmri-client'
import { LightState, type LightData, type LightMessage } from './types'

export class LightManager extends EventEmitter {
  private client: WebSocketClient
  private lights: Map<string, LightState> = new Map()

  constructor(client: WebSocketClient) {
    super()
    this.client = client

    this.client.on('update', (message: any) => {
      if (message.type === 'light') {
        this.handleLightUpdate(message)
      }
    })
  }

  async getLight(name: string): Promise<LightState> {
    const message: LightMessage = { type: 'light', data: { name } }
    const response = await (this.client as any).request<LightMessage>(message)
    const state = response.data?.state ?? LightState.UNKNOWN
    this.lights.set(name, state)
    return state
  }

  async setLight(name: string, state: LightState): Promise<void> {
    const message: LightMessage = { type: 'light', method: 'post', data: { name, state } }
    await (this.client as any).request<LightMessage>(message)
    const oldState = this.lights.get(name)
    this.lights.set(name, state)
    if (oldState !== state) {
      this.emit('light:changed', name, state)
    }
  }

  async turnLightOn(name: string): Promise<void> {
    return this.setLight(name, LightState.ON)
  }

  async turnLightOff(name: string): Promise<void> {
    return this.setLight(name, LightState.OFF)
  }

  async listLights(): Promise<LightData[]> {
    const message: LightMessage = { type: 'light', method: 'list' }
    const response = await (this.client as any).request<any>(message)
    const entries: LightData[] = Array.isArray(response?.data)
      ? response.data.map((r: any) => r.data ?? r)
      : []
    for (const entry of entries) {
      if (entry.name && entry.state !== undefined) {
        this.lights.set(entry.name, entry.state)
      }
    }
    return entries
  }

  getLightState(name: string): LightState | undefined {
    return this.lights.get(name)
  }

  getCachedLights(): Map<string, LightState> {
    return new Map(this.lights)
  }

  private handleLightUpdate(message: LightMessage): void {
    const name = message.data?.name
    const state = message.data?.state
    if (!name || state === undefined) return
    const oldState = this.lights.get(name)
    this.lights.set(name, state)
    if (oldState !== state) {
      this.emit('light:changed', name, state)
    }
  }
}
