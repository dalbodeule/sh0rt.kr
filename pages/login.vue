<script setup lang="ts">
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";

const methods: Array<{url: string, display: string, id: string, color: string, bgcolor: string, icon: boolean}> = [
  { url: `/auth/google`, display: 'Google 로그인', id: 'google', icon: true, color: '#444', bgcolor: '#ffffff'},
  // { url: `/auth/naver`, display: 'Naver 로그인', id: 'naver', icon: false, color: '#ffffff', bgcolor: '#03c75a'},
  { url: `/auth/github`, display: 'Github 로그인', id: 'github', icon: true, color: '#333', bgcolor: '#fafafa'},
]
</script>

<template>
  <div class="container box" style="min-height: 80vh">
    <div v-for="method in methods" style="margin-left: auto; margin-top: 20px;">
      <a v-if="method.icon" v-bind:href="method.url" class="button is-align-content-center" v-bind:style="`background: ${method.bgcolor}; color: ${method.color}; width: 180px;`">
        <FontAwesomeIcon :icon="['fab', method.id]" size="xs"/>&nbsp; {{ method.display }}
      </a>
      <a v-else v-bind:href="method.url" class="button is-align-self-center" v-bind:style="`background: ${method.bgcolor}; color: ${method.color}; width: 180px;`">
        <img v-bind:src="`/${method.id}-logo.png`" alt="" style="height: 20px"/>&nbsp; {{ method.display }}
      </a>
    </div>
  </div>
</template>

<style scoped>

</style>