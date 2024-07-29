import * as Sentry from '@sentry/vue'

async function lazyLoadSentryIntegrations() {
    if (!import.meta.client) return;

    const { replayIntegration } = await import("@sentry/vue");

    Sentry.addIntegration(replayIntegration({
        maskAllText: false,
        blockAllMedia: false
    }));
}

function getSentryIntegrations() {
    if (!import.meta.client) return;

    const router = useRouter()
    const browserTracing = Sentry.browserTracingIntegration({
        router
    })

    return [ browserTracing ]
}

export default defineNuxtPlugin({
    name: 'sentry',
    parallel: true,
    async setup(nuxtApp)  {
        const vueApp = nuxtApp.vueApp
        const config = useRuntimeConfig()

        Sentry.init({
            app: vueApp,
            dsn: config.public.sentryDsnPublic ?? "",
            integrations: getSentryIntegrations(),
            tracesSampleRate: 1.0,
            replaySessionSampleRate: 1.0,
            replaysOnErrorSampleRate: 1.0
        });

        await lazyLoadSentryIntegrations();
    }
})