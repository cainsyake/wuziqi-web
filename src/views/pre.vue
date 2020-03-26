<template>
  <div class="page-pre">
    <div class="step-container">
      <div class="step-1" v-if="currentStep === 1">
        <div class="welcome">
          <p>联机五子棋</p>
        </div>
        <p>开始游戏前请注册你的ID（如手机号,QQ号）</p>
        <div class="user-register">
          <van-field v-model="userId" class="user-id-input" type="tel" placeholder="请输入你的ID" />
          <van-button type="info" class="user-id-btn" size="" @click="handleCheckUserId"
            >注册</van-button
          >
        </div>
      </div>

      <div class="step-2" v-else>
        <div class="current-id"></div>
        <div class="way-container">
          <p>你的ID: {{ userId }}</p>
          <p>请选择游戏方式</p>
          <div class="way-btn-container">
            <van-button type="primary" class="item" @click="handleWaitFriend">
              等待好友对战
            </van-button>
            <van-button type="warning" class="item" @click="handleJoinFriend">
              加入好友对战
            </van-button>
          </div>

          <div class="friend-info" v-if="typeFriendInfo">
            <van-field
              v-model="friendId"
              class="user-id-input"
              type="tel"
              placeholder="请输入好友的ID"
            />
            <van-button type="info" class="user-id-btn" size="" @click="handleCheckFriendId"
              >确定</van-button
            >
          </div>

          <div class="invite-url">
            <van-button
              type="info"
              class="invite-url-button"
              :data-clipboard-text="inviteUrl"
              size="small"
              plain
              @click="handleGenerateInviteUrl"
            >
              点此复制链接，邀请好友进行对战
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { Vue, Component } from 'vue-property-decorator'
import { getUserId } from '@/lib/util'
import { Button, Field, Toast } from 'vant'
import { wsSend } from '@/lib/ws'
import bus from '@/bus'
import { serverCommands, clientCommands } from '@/lib/command'
import clipboard from 'clipboard'

import 'vant/lib/button/style'
import 'vant/lib/field/style'
import 'vant/lib/toast/style'

Vue.use(Button)
Vue.use(Field)
Vue.use(Toast)

@Component({
  components: {
    [Button.name]: Button,
    [Field.name]: Field,
  },
})
export default class Pre extends Vue {
  currentStep = 1

  userId = getUserId()
  friendId = ''
  typeFriendInfo = false
  inviteUrl = window.location.origin

  mounted() {
    // this.currentStep
    bus.$on(clientCommands.existResult, this.userIdCheckResult)
  }

  handleCheckUserId() {
    const userId = this.userId.trim()
    if (!userId) {
      alert('请输入ID')
    }
    wsSend(serverCommands.existId, { userId: userId })
  }

  userIdCheckResult(payload: any) {
    if (this.currentStep === 1) {
      if (payload.exist) {
        alert(`ID: ${payload.userId}已存在，请尝试别的ID`)
      } else {
        wsSend(serverCommands.registerId, { userId: payload.userId })
        localStorage.userId = payload.userId
        this.currentStep = 2
      }
    } else {
      if (payload.exist) {
        this.$router.push({
          name: 'chess',
          query: {
            type: 'join',
            friend: payload.userId,
          },
        })
      } else {
        alert(`ID: ${payload.userId}不存在，请填写正确的ID`)
      }
    }
  }

  handleWaitFriend() {
    this.$router.push({
      name: 'chess',
      query: {
        type: 'wait',
      },
    })
  }

  handleJoinFriend() {
    this.typeFriendInfo = true
  }

  handleCheckFriendId() {
    const friendId = this.friendId.trim()
    if (!friendId) {
      alert('请输入ID')
    }
    wsSend(serverCommands.existId, { userId: friendId })
  }

  handleGenerateInviteUrl() {
    this.inviteUrl = window.location.origin + `/chess?type=join&friend=${this.userId}`
    const cb = new clipboard('.invite-url-button')
    Toast.success({
      message: '复制成功 \n 请点击 等待好友对战 \n 并将链接分享给你的好友。',
      className: 'copy-url-toast',
      duration: 3000,
    })
  }
}
</script>

<style lang="stylus" scoped>
.page-pre
  height 100vh
  background-color lightskyblue

.step-1
  padding 25vh 20px
  text-align center

.user-register
  display flex
  justify-content space-around

.user-id-input
  width 50vw

.user-id-btn
  padding 0 10px
  width 80px

.step-2
  padding 25vh 20px
  text-align center

.way-btn-container
  display flex
  justify-content space-around

  .item
    width 120px

.friend-info
  margin-top 20px
  display flex
  justify-content space-around

.invite-url
  margin-top 40px
</style>
<style lang="stylus">
.copy-url-toast
  width 200px
</style>
