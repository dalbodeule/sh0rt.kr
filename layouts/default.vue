<script setup lang="ts">
  useHead({
    htmlAttrs: {
      class: 'theme-light'
    }
  })
</script>

<template>
  <Header />
  <div class="container" style="margin-top: 20px; min-height: 80vh;">
    <NuxtPage />
  </div>
  <Footer />
</template>

<style src="~/node_modules/bulma/bulma.scss"></style>
<style src="~/node_modules/bulma/sass/themes/light.scss"></style>