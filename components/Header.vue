<script setup lang="ts">
import type {Ref} from "vue";

const show: Ref<boolean> = ref(false)
const { loggedIn, user, session, clear } = useUserSession()
</script>

<template>
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <NuxtLink class="navbar-item" to="/">
        <!-- <img src="~/public/favicon.png" alt=""/>&nbsp; sh0rt.-->

      </NuxtLink>
    </div>
    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="show = !show">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
    <div class="navbar-menu" v-bind:class="show ? 'is-active' : ''">
      <div class="navbar-start">
        <NuxtLink class="navbar-item" to="#">Test</NuxtLink>
      </div>
      <div class="navbar-end" v-if="loggedIn">
        <div class="navbar-item">
          <img v-bind:src="user?.profile" alt="user profile"/>
          <span>&nbsp; {{ user?.name}}</span>
        </div>
        <button type="button" class="navbar-item" @click="clear">로그아웃</button>
      </div>
      <div class="navbar-end" v-else>
        <NuxtLink class="navbar-item" to="/login">로그인</NuxtLink>
      </div>
    </div>
  </nav>
</template>