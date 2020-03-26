import { rid } from '@/lib/util'
import { clientCommands } from '@/lib/command'
import bus from '@/bus'

export let ws: WebSocket

export function init() {
  // 打开一个WebSocket:
  ws = new WebSocket(`ws://local.cainsyake.com:11220/?rid=${rid()}`)
  // 响应onmessage事件:
  ws.onmessage = function(msg) {
    const data = JSON.parse(msg.data)
    bus.$emit(data.command, data.payload)
  }
}

export function wsSend(command: string, payload: any) {
  ws.send(
    JSON.stringify({
      command,
      payload,
    }),
  )
}
