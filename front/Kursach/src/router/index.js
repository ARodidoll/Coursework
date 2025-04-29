import { createRouter, createWebHistory } from 'vue-router'

import loading from '@/components/LoadingScreen.vue'
import main from '@/components/main.vue'
import store from '@/components/CatStore.vue'
import section from '@/components/CatSection.vue'
import friend from '@/components/Friend.vue'
import leaderboard from '@/components/Leaderboard.vue'
import top from '@/components/Top.vue'
import about from '@/components/AboutUs.vue/'
import storepage from '@/components/StorePage.vue'


const routes = [
  {
    path: '/',
    name: 'loading',
    component: loading
  },
  {
    path: '/main',
    name: 'main',
    component: main
  },
  {
    path: '/store',
    name: 'store',
    component: store
  },
  {
    path: '/section',
    name: 'section',
    component: section
  },
  {
    path: '/friend',
    name: 'friend',
    component: friend
  },
  {
    path: '/leaderbord',
    name: 'leaderbord',
    component: leaderboard
  },
  {
    path: '/top',
    name: 'top',
    component: top
  },
  {
    path: '/about',
    name: 'about',
    component: about
  },
  {
    path: '/storepage',
    name: 'storepage',
    component: storepage
  }
  
 

]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
