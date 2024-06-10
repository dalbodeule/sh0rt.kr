export default defineEventHandler((event) => {
    const cfip = getHeader(event, 'x-real-ip')
    const ip = cfip ?? getRequestIP(event, { xForwardedFor: true })

    return `<html><head><title>Current IP Check</title></head><body>Current IP Address: ${ip}</body></html>`
})