<script setup lang="ts">
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const methods: Array<{url: string, display: string, id: string, color: string, bgcolor: string, icon: boolean}> = [
  { url: `/auth/google`, display: 'Google 로그인', id: 'google', icon: true, color: '#444', bgcolor: '#ffffff'},
  // { url: `/auth/naver`, display: 'Naver 로그인', id: 'naver', icon: false, color: '#ffffff', bgcolor: '#03c75a'},
  { url: `/auth/github`, display: 'Github 로그인', id: 'github', icon: true, color: '#333', bgcolor: '#fafafa'},
]

useSeoMeta({
  title: `sh0rt.kr :: login`,
  description: `sh0rt.kr :: 강력한 URL 단축기`,
  robots: { all: false },
  ogType: 'website',
  ogSiteName: 'sh0rt.kr',
  ogImage: '/favicon.png',
})
</script>

<template>
  <div class="box content">
    <div v-for="method in methods" :key="`login-${method.id}`" style="margin-left: auto; margin-top: 20px;">
      <a v-if="method.icon" :href="method.url" class="button is-align-content-center" :style="`background: ${method.bgcolor}; color: ${method.color}; width: 180px;`">
        <FontAwesomeIcon :icon="['fab', method.id]" size="xs"/>&nbsp; {{ method.display }}
      </a>
      <a v-else :href="method.url" class="button is-align-self-center" :style="`background: ${method.bgcolor}; color: ${method.color}; width: 180px;`">
        <img :src="`/${method.id}-logo.png`" alt="" style="height: 20px">&nbsp; {{ method.display }}
      </a>
    </div>
  </div>
</template>

<style scoped>

</style>