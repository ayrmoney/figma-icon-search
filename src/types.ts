import { EventHandler } from '@create-figma-plugin/utilities'

export interface StartHandler extends EventHandler {
  name: 'START'
  handler: () => void
}

export interface CloseHandler extends EventHandler {
  name: 'CLOSE'
  handler: () => void
}

export interface ProgressHandler extends EventHandler {
  name: 'PROGRESS'
  handler: (progressCount: number) => void
}

export interface IconCountHandler extends EventHandler {
  name: 'ICON_COUNT'
  handler: (iconCount: number) => void
}