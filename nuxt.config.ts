// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },
  srcDir: ".",
  compatibilityDate: '2026-09-16',
  dir: {
    app: "app"
  },
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
      ignore: ['/']
    },
    experimental: {
      tasks: true
    },
    preset: "cloudflare_module",
  },
  css: ['@fortawesome/fontawesome-svg-core/styles.css', '~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    analyticsAccountId: process.env.ANALYTICS_ACCOUNT_ID,
    analyticsApiToken: process.env.ANALYTICS_API_TOKEN,
    session: {
      password: process.env.SESSION_PASSWORD ?? "",
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
    },
    reportEmails: process.env.NUXT_REPORT_EMAILS ?? ""
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.TURNSTILE_SITE_KEY,
  },
  modules: [
    "nuxt-auth-utils",
    "@nuxt/eslint",
    "@nuxtjs/turnstile",
    "nitro-cloudflare-dev"
  ]
})
