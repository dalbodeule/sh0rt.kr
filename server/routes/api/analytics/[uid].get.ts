import {H3Event} from "h3";
import { AKeys, getFromAnalytics, getParams } from "~/server/utils/analyticHelper";
import { useDrizzle } from "~/server/utils/useDrizzle";
import { and, eq, gte } from "drizzle-orm";
import { urls } from "~/server/db/schema";

export interface IAnalyticsResponse {
    meta: { name: string, type: string }[],
    data: { ip: string, country: string, region: string, city: string, colo: string, latitude: string,
        longitude: string, browser: string, device: string, language: string, timestmap: string }[],
    rows: number,
    rows_before_limit_as_least: number
}

export default defineEventHandler(async (event: H3Event) => {
    const uid = getRouterParam(event, 'uid') ?? ''
    if(!uid) throw createError({
        status: 404,
        message: 'Not found',
    })

    const db = useDrizzle()
    const currentShorten = await db.query.urls.findFirst({
        where: and(
            eq(urls.uid, uid),
            gte(urls.expires, new Date())
        ),
    })

    const data = await getFromAnalytics(
        `SELECT ${getParams([
            AKeys.ip, AKeys.country, AKeys.region, AKeys.city, AKeys.colo, AKeys.latitude, AKeys.longitude, AKeys.browser, AKeys.device, AKeys.language
        ])}, timestamp from ANALYTICS WHERE index1 = '${uid}' and timestamp >= toDateTime(${
            Math.round((currentShorten?.created_at ?? new Date()).getTime() / 1000)
        })`
    )

    try {
        return JSON.parse(data)
    } catch (e) {
        throw createError({
            status: 400,
            message: 'Could not parse analytics',
        })
    }
})