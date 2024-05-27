// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
      ignore: ['/']
    },
    preset: "cloudflare-module"
  },
  build: {
    transpile: ['Dayjs']
  },
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET,
    dbid: process.env.DBID,
    analyticsAccountId: process.env.ANALYTICS_ACCOUNT_ID,
    analyticsApiToken: process.env.ANALYTICS_API_TOKEN,
    oauth: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }
    },
    public: {
      baseUrl: process.env.BASE_URL,
    }
  },
  hub: {
    analytics: true,
    database: true
  },
  modules: ["nuxt-auth-utils", "@nuxthub/core"]
})