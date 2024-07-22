// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2024-07-20",
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
      ignore: ['/']
    },
    experimental: {
      tasks: true
    },
    preset: "cloudflare-module"
  },
  build: {
    transpile: ['Dayjs', 'linkedom']
  },
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],
  runtimeConfig: {
    analyticsAccountId: process.env.NUXT_ANALYTICS_ACCOUNT_ID,
    analyticsApiToken: process.env.NUXT_ANALYTICS_API_TOKEN,
    domainZoneId: process.env.NUXT_DOMAIN_ZONE_ID,
    domainApiToken: process.env.NUXT_DOMAIN_API_TOKEN,
    domainApiEmail: process.env.NUXT_DOMAIN_API_EMAIL,
    apiBackend: process.env.NUXT_API_BACKEND,
    session: {
      password: process.env.NUXT_SESSION_PASSWORD
    },
    oauth: {
      github: {
        clientId: process.env.NUXT_GITHUB_CLIENT_ID,
        clientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: process.env.NUXT_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET,
      }
    },
    public: {
      baseUrl: process.env.NUXT_BASE_URL,
      domainList: process.env.NUXT_DOMAIN_LIST,
      domainLimit: process.env.NUXT_DOMAIN_LIMIT,
    }
  },
  turnstile: {
    secretKey: process.env.NUXT_TURNSTILE_SECRET_KEY,
    siteKey: process.env.NUXT_TURNSTILE_SITE_KEY,
  },
  hub: {
    analytics: true,
    database: true
  },
  purgecss: {
    safelist: [/svg.*/, /fa.*/]
  },
  modules: [
    "nuxt-auth-utils",
    "@nuxthub/core",
    "nuxt-purgecss",
    "@nuxt/eslint",
    "@nuxtjs/turnstile"
  ]
})