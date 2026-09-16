import PostalMime from 'postal-mime'
import { eq } from 'drizzle-orm'
import { reports, urls } from '~/server/db/schema'
import { useDrizzle } from '~/server/utils/useDrizzle'

export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('cloudflare:email', async (payload) => {
        const config = useRuntimeConfig()
        const emails = (config.reportEmails || 'report@example.com') as string

        const reportEmails = emails
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean)
        if (!reportEmails.includes(payload.message.to.trim().toLowerCase())) return
        const parsed = await PostalMime.parse(payload.message.raw)
        const text = (parsed.text || '').slice(0, 20000)
        const match = text.match(/https?:\/\/(?:www\.)?sh0rt\.kr\/([a-zA-Z0-9]{3,20})/i)
        const uid = match?.[1] ?? null

        const db = useDrizzle((payload.env as { DB: D1Database }).DB)

        const target = uid ? await db.select({ id: urls.id, uid: urls.uid, forward: urls.forward }).from(urls).where(eq(urls.uid, uid)).limit(1) : []

        await db.insert(reports).values({
            url_id: target[0]?.id ?? null,
            uid: target[0]?.uid ?? uid,
            forward: target[0]?.forward ?? null,
            reason: 'email',
            details: '',
            source: 'email',
            sender: payload.message.from.slice(0, 255),
            subject: (parsed.subject || '').slice(0, 500),
            body_text: text,
            status: 'open',
        })
    })
})
