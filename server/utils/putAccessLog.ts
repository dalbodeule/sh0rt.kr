import {H3Event} from "h3";
import CF_Ray from "~/server/utils/cf-ray";

export default async function putAccessLog(event: H3Event): Promise<CF_Ray> {
    const ip = getHeader(event, 'x-real-ip') ?? getRequestIP(event, { xForwardedFor: true })
    const { cloudflare, cf } = event.context

    return cf
}