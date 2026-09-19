// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  devtools: { enabled: true },
  srcDir: '.',
  compatibilityDate: '2026-09-18',
  dir: {
    app: 'app',
  },
  nitro: {
    prerender: {
      autoSubfolderIndex: false,
      ignore: ['/'],
    },
    experimental: {
      tasks: true,
    },
    preset: 'cloudflare_module',
  },
  css: ['@fortawesome/fontawesome-svg-core/styles.css', '~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    analyticsAccountId: process.env.ANALYTICS_ACCOUNT_ID,
    analyticsApiToken: process.env.ANALYTICS_API_TOKEN,
    session: {
      password: process.env.SESSION_PASSWORD ?? '',
    },
    oauth: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      twitch: {
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
      },
      chzzk: {
        clientId: process.env.CHZZK_CLIENT_ID,
        clientSecret: process.env.CHZZK_CLIENT_SECRET,
      },
    },
    public: {
      baseUrl: process.env.BASE_URL,
      shortLinkDomains: process.env.NUXT_REPORT_DOMAINS ?? '',
    },
    reportDomains: process.env.NUXT_REPORT_DOMAINS ?? '',
    reportEmails: process.env.NUXT_REPORT_EMAILS ?? '',
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.TURNSTILE_SITE_KEY,
  },
  i18n: {
    defaultLocale: 'ko',
    strategy: 'no_prefix',
    langDir: 'locales',
    locales: [
      { code: 'ko', language: 'ko-KR', name: '한국어', file: 'ko.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ja', language: 'ja-JP', name: '日本語', file: 'ja.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
  modules: [
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
    '@nuxt/eslint',
    '@nuxtjs/turnstile',
    'nitro-cloudflare-dev',
  ],
});
