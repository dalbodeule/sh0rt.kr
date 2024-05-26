import GChart from 'vue-google-charts'

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.vueApp.use(GChart)
})