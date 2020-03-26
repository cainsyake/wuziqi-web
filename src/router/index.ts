import Vue from 'vue'
import VueRouter from 'vue-router'
import Pre from '../views/pre.vue'
import Chess from '../views/chess.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'pre',
    component: Pre,
  },
  {
    path: '/chess',
    name: 'chess',
    component: Chess,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
