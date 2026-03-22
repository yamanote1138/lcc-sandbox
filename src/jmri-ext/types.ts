/**
 * Sensor and Light types for JMRI JSON protocol
 * These extend the base jmri-client types with sensor and light support.
 */

import type { JmriMessage } from 'jmri-client'

/**
 * Sensor state values (from JMRI JSON protocol constants)
 */
export enum SensorState {
  UNKNOWN = 0,
  ACTIVE = 2,
  INACTIVE = 4
}

export function sensorStateToString(state: SensorState): string {
  switch (state) {
    case SensorState.ACTIVE: return 'ACTIVE'
    case SensorState.INACTIVE: return 'INACTIVE'
    default: return 'UNKNOWN'
  }
}

export interface SensorData {
  name: string
  userName?: string
  state?: SensorState
  inverted?: boolean
  comment?: string
}

export interface SensorMessage extends JmriMessage {
  type: 'sensor'
  data?: SensorData
}

/**
 * Light state values (from JMRI JSON protocol constants)
 */
export enum LightState {
  UNKNOWN = 0,
  ON = 2,
  OFF = 4
}

export function lightStateToString(state: LightState): string {
  switch (state) {
    case LightState.ON: return 'ON'
    case LightState.OFF: return 'OFF'
    default: return 'UNKNOWN'
  }
}

export interface LightData {
  name: string
  userName?: string
  state?: LightState
  comment?: string
}

export interface LightMessage extends JmriMessage {
  type: 'light'
  data?: LightData
}
