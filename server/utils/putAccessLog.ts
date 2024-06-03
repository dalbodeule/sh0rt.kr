import type {H3Event} from "h3";
import type CF_Ray from "~/server/utils/cf-ray";

export default async function putAccessLog(event: H3Event): Promise<CF_Ray> {
    const _ip = getHeader(event, 'x-real-ip') ?? getRequestIP(event, { xForwardedFor: true })
    const { _cloudflare, cf } = event.context

    return cf
}