import type { H3Event } from "h3"
import { parse } from 'node-html-parser'

async function fetchAndParseOGTags(url: string) {
    try {
        const response = await $fetch(url, { method: 'GET' });
        const dom = parse(response as string);
        const metas = dom.querySelectorAll('meta[property^="og:"]')

        const ogTags: {[key: string]: string} = {};
        metas.forEach(meta => {
            const property = meta.getAttribute('property') ?? '';
            ogTags[property] = meta.getAttribute('content') ?? '';
        });

        return ogTags;
    } catch (error) {
        console.error("Error fetching or parsing:", error);
        throw error
    }
}

export default defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event) as { url: string }

    try {
        return await fetchAndParseOGTags(body.url)
    } catch (error: unknown) {
        throw createError({
            status: 403,
            statusMessage: "Error",
            stack: error?.stack ?? error?.message ?? '',
        })
    }
})