export default defineEventHandler((_event) => {
    const config = useRuntimeConfig()
    return {
        hello: 'world',
        envs: config.domainApiToken
    }
})