<script setup lang="ts">
import SiteFooter from "~/components/SiteFooter.vue";
import SiteHeader from "~/components/SiteHeader.vue";

useHead({
  htmlAttrs: {
    class: 'theme-light'
  }
})
</script>

<template>
  <div>
    <SiteHeader />
    <div class="container" style="margin-top: 20px; min-height: 80vh;">
      <NuxtPage />
    </div>
    <SiteFooter />
  </div>
</template>

<style src="~/node_modules/bulma/bulma.scss"></style>
<style src="~/node_modules/bulma/sass/themes/light.scss"></style>