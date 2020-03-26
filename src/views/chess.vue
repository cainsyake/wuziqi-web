<template>
  <div class="page-chess">
    <div class="game-info">
      <div class="status">
        <span>游戏状态：</span>
        <span>{{ gameStatusText }}</span>
      </div>
      <div class="role">
        <span>我是：</span>
        <span>{{ role === 'w' ? '白方' : '黑方' }}</span>
      </div>
      <div v-show="false" class="role role-white">
        <span>白方：</span>
        <span>{{ gameInfo.w }}</span>
      </div>
      <div v-show="false" class="role role-black">
        <span>黑方：</span>
        <span>{{ gameInfo.b }}</span>
      </div>
    </div>
    <div class="main">
      <div class="current-role" v-if="gameStatus === 'play'">
        <span>当前{{ currentStep.role === 'w' ? '白方' : '黑方' }}下棋，</span>
        <span>剩余 {{ lastTime }} 秒</span>
      </div>

      <div class="chessboard" ref="chessboard">
        <div v-for="itemRow in size" class="row" :key="itemRow">
          <div
            v-for="itemCol in size"
            class="col"
            :key="itemCol"
            :style="cellStyle"
            @click="handleCellClick(itemCol, itemRow)"
          >
            <div
              v-if="stepItemClass(itemCol, itemRow)"
              class="step-item"
              :class="stepItemClass(itemCol, itemRow)"
            ></div>
            <div class="aim-container" v-if="itemRow === focusPoint.y && itemCol === focusPoint.x">
              <van-icon name="aim" />
              <div class="aim-tips">二次点击确认落子</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { Button, Icon, Toast } from 'vant'
import { wsSend } from '@/lib/ws'
import { clientCommands, serverCommands } from '@/lib/command'
import bus from '@/bus'
import { getUserId } from '@/lib/util'

import 'vant/lib/button/style'
import 'vant/lib/icon/style'
import 'vant/lib/toast/style'

Vue.use(Button)
Vue.use(Icon)
Vue.use(Toast)

enum GameStatus {
  wait = 'wait',
  play = 'play',
  end = 'end',
}
interface IStep {
  role: string
  x: number
  y: number
  win: boolean
  w: string
  b: string
}
interface IGameInfo {
  first: string
  w: string
  b: string
}

@Component({
  components: {
    [Button.name]: Button,
    [Icon.name]: Icon,
  },
})
export default class Chess extends Vue {
  size = 14
  // 玩家信息
  gameInfo = {
    first: '',
    w: '',
    b: '',
  }
  // 当前用户的角色
  role = ''
  // 游戏状态
  gameStatus = GameStatus.wait
  // 当前步骤
  currentStep: IStep = {
    role: '',
    x: 0,
    y: 0,
    win: false,
    w: '',
    b: '',
  }
  // 步骤记录
  stepLogs: IStep[] = []

  // 聚焦点
  focusPoint = {
    x: 0,
    y: 0,
  }
  // 定时器
  timer: any = null
  // 剩余时间
  lastTime = 0
  // 时间设置
  settingTime = 30

  // 单元格样式
  cellStyle = {}

  get friendId() {
    if (this.gameInfo.w && this.gameInfo.b) {
      return this.role === 'w' ? this.gameInfo.b : this.gameInfo.w
    } else {
      return this.$route.query.friend
    }
  }

  get gameStatusText() {
    switch (this.gameStatus) {
      case GameStatus.end:
        return '已结束'
      case GameStatus.play:
        return '游戏中'
      case GameStatus.wait:
        return '等待中'
      default:
        return ''
    }
  }

  setCellStyle() {
    const chessboard: any = this.$refs.chessboard

    if (chessboard) {
      const boardWidth = chessboard.clientWidth - 40

      const cellWidth = boardWidth / this.size
      this.cellStyle = {
        width: `${cellWidth}px`,
        height: `${cellWidth}px`,
      }
    }
  }

  handleCellClick(x: number, y: number) {
    // 首先判断当前状态，是否允许下棋
    if (
      this.stepItemClass(x, y) ||
      this.currentStep.role !== this.role ||
      [GameStatus.wait, GameStatus.end].includes(this.gameStatus)
    ) {
      return false
    }

    // 判断是否为聚焦点
    if (this.focusPoint.x === x && this.focusPoint.y === y) {
      this.handleConfirmStep(x, y)
      // 还原聚焦点
      this.focusPoint = {
        x: 0,
        y: 0,
      }
    } else {
      // 重设聚焦点
      this.focusPoint.x = x
      this.focusPoint.y = y
    }
  }

  handleConfirmStep(x: number, y: number) {
    const players = this.getPlayers()

    // 首先判断结果win
    const win = this.isWin(x, y, this.role)
    const payload: IStep = {
      role: this.role,
      x,
      y,
      win,
      w: players.w,
      b: players.b,
    }
    // 记录步骤
    this.stepLogs.push(payload)

    // 变更步骤
    this.currentStep.role = this.role === 'w' ? 'b' : 'w'

    wsSend(serverCommands.confirmNextStep, payload)

    if (win) {
      this.handleGameOver(true)
    } else {
      // 设置计时器
      this.setTimer()
    }
  }

  handleStartNextStep(payload: IStep | null) {
    // 添加到步骤记录，用于绘制棋子
    if (payload) {
      this.stepLogs.push(payload)

      if (payload.win) {
        this.handleGameOver(false)
      }
    }
    // 标记为当前用户下棋
    this.currentStep.role = this.role
    // 设置计时器
    this.setTimer()
  }

  handleStartGame(payload: IGameInfo) {
    console.log(payload)
    this.gameStatus = GameStatus.play
    console.log(`已重置游戏状态:${this.gameStatus}`)
    this.gameInfo = payload
    if (this.role !== payload.first) {
      this.currentStep.role = payload.first
      // 设置计时器
      this.setTimer()
    }
  }

  setTimer() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.lastTime = this.settingTime
    this.timer = setInterval(() => {
      this.lastTime--
      // 倒计时已到
      if (this.lastTime <= 0) {
        clearInterval(this.timer)
        // 如果当前是下棋方，提交空白记录
        if (this.currentStep.role === this.role) {
          // 还原聚焦点
          this.focusPoint = {
            x: 0,
            y: 0,
          }
          // 提交空白点
          this.handleConfirmStep(0, 0)
        }
      }
    }, 1000)
  }

  initRole() {
    if (this.$route.query.type === 'wait') {
      this.role = 'w'
    } else {
      this.role = 'b'
      // 黑方触发开始游戏
      this.startGame()
    }
  }

  getPlayers() {
    const selfId = getUserId()
    const friendId = this.friendId
    return {
      w: this.role === 'w' ? selfId : friendId,
      b: this.role === 'b' ? selfId : friendId,
    }
  }

  startGame() {
    const players = this.getPlayers()
    const payload: IGameInfo = {
      first: Math.random() >= 0.5 ? 'w' : 'b',
      w: players.w,
      b: players.b,
    }

    wsSend(serverCommands.startGame, payload)
  }

  stepItemClass(x: number, y: number) {
    const step = this.stepLogs.find(item => item.x === x && item.y === y)
    if (step) {
      return `step-item-${step.role}`
    } else {
      return ''
    }
  }

  handleGameOver(win: boolean) {
    this.gameStatus = GameStatus.end

    Toast.success({
      message: `游戏结束 \n 你${win ? '赢' : '输'}了。`,
      duration: 3000,
    })

    const restartTime = 4000 + (win ? 0 : 1000)
    // 6秒后自动开始游戏
    setTimeout(() => {
      this.handleRestart(win)
    }, restartTime)
  }

  isWin(x: number, y: number, role: string) {
    let winflag = 1
    // 垂直方向判断
    for (let i = y + 1; i <= this.size; i++) {
      const step = this.stepLogs.find(item => item.y === i && item.x === x)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    for (let i = y - 1; i > 0; i--) {
      const step = this.stepLogs.find(item => item.y === i && item.x === x)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    // 垂直判断结果
    if (winflag > 4) {
      return true
    } else {
      // 重置标记
      winflag = 1
    }

    // 水平方向判断
    for (let i = x + 1; i <= this.size; i++) {
      const step = this.stepLogs.find(item => item.y === y && item.x === i)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    for (let i = x - 1; i > 0; i--) {
      const step = this.stepLogs.find(item => item.y === y && item.x === i)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    // 判断结果
    if (winflag > 4) {
      return true
    } else {
      // 重置标记
      winflag = 1
    }

    // 左下至右上方向判断
    for (let i = x + 1, j = y + 1; i <= this.size; i++, j++) {
      const step = this.stepLogs.find(item => item.y === j && item.x === i)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    for (let i = x - 1, j = y - 1; i > 0; i--, j--) {
      const step = this.stepLogs.find(item => item.y === j && item.x === i)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    // 判断结果
    if (winflag > 4) {
      return true
    } else {
      // 重置标记
      winflag = 1
    }

    // 左上至右下方向判断
    for (let i = x - 1, j = y + 1; i > 0; i--, j++) {
      const step = this.stepLogs.find(item => item.y === j && item.x === i)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    for (let i = x + 1, j = y - 1; i <= this.size; i++, j--) {
      const step = this.stepLogs.find(item => item.y === j && item.x === i)
      if (step && step.role === role) {
        winflag++
      } else {
        break
      }
    }

    // 判断结果
    if (winflag > 4) {
      return true
    } else {
      return false
    }
  }

  handleRestart(win: boolean) {
    // 重置身份 胜利方重置身份为白(w)，败方重置身份为黑(b)，
    const newRole = win ? 'w' : 'b'
    const change = this.role !== newRole
    this.role = newRole

    // 交换角色
    if (change) {
      const temp = this.gameInfo.w
      this.gameInfo.w = this.gameInfo.b
      this.gameInfo.b = temp
    }

    // 清空数据
    this.currentStep = {
      role: '',
      x: 0,
      y: 0,
      win: false,
      w: '',
      b: '',
    }
    this.stepLogs = []
    this.focusPoint = {
      x: 0,
      y: 0,
    }
    this.lastTime = 0
    clearTimeout(this.timer)
    this.timer = null

    // 重置为等待状态
    this.gameStatus = GameStatus.wait

    if (this.role === 'b') {
      this.startGame()
    }
  }

  mounted() {
    this.initRole()
    this.$nextTick(this.setCellStyle)
    bus.$on(clientCommands.startNextStep, this.handleStartNextStep)
    bus.$on(clientCommands.startNotice, this.handleStartGame)
  }
}
</script>

<style lang="stylus" scoped>
.page-chess
  height calc(100vh - 20px * 2)
  padding 20px
  background-color lightskyblue


.game-info
  padding-bottom 20px
  border-bottom solid 2px

.current-role
  padding 10px 0

.chessboard
  padding 20px
  background-color antiquewhite

  .row
    display flex
    align-items center

  .col
    text-align center
    border solid 1px
    display flex
    justify-content center
    align-items center

.aim-container
  position relative
  padding-top 1px
  .aim-tips
    position absolute
    top -25px
    right -140px
    width 140px
    padding 4px 0
    background-image linear-gradient(to right, #fff, #cef3fd)
    border-radius 4px

.step-item
  border-radius 50%
  width 12px
  height 12px

.step-item-w
  background-color #fff

.step-item-b
  background-color black
</style>
