/**
 * LCC Sandbox type definitions
 */

export interface SensorItem {
  name: string
  userName?: string
  state: number
}

export interface LightItem {
  name: string
  userName?: string
  state: number
}

export interface LccConnectionSettings {
  host: string
  port: number
  secure: boolean
  mockEnabled: boolean
  debugEnabled: boolean
}
