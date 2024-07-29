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
    analyticsAccountId: process.env.ANALYTICS_ACCOUNT_ID,
    analyticsApiToken: process.env.ANALYTICS_API_TOKEN,
    domainZoneId: process.env.DOMAIN_ZONE_ID,
    domainApiToken: process.env.DOMAIN_API_TOKEN,
    domainApiEmail: process.env.DOMAIN_API_EMAIL,
    apiBackend: process.env.API_BACKEND,
    session: {
      password: process.env.SESSION_PASSWORD
    },
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
      domainList: process.env.DOMAIN_LIST,
      domainLimit: process.env.DOMAIN_LIMIT,
    }
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.TURNSTILE_SITE_KEY,
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