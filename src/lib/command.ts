export const serverCommands = {
  // 检查id是否存在，可用于注册id以及搜索id
  existId: 'existId',
  // 注册id
  registerId: 'registerId',
  // 等待对手
  waitOpponent: 'waitOpponent',
  // 寻找对手
  findOpponent: 'findOpponent',
  // 开始游戏
  startGame: 'startGame',
  // 确认下一步
  confirmNextStep: 'confirmNextStep',
}
export const clientCommands = {
  // 检查id结果
  existResult: 'existResult',
  // 开始游戏通知
  startNotice: 'startNotice',
  // 开始下棋
  startNextStep: 'startNextStep',
  // 游戏结束
  endGame: 'endGame',
}
