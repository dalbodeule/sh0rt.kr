import {H3Event} from "h3";
import { AKeys, getFromAnalytics, getParams } from "~/server/utils/analyticHelper";
import { useDrizzle } from "~/server/utils/useDrizzle";
import { and, eq, gte } from "drizzle-orm";
import {analyticsCache, urls} from "~/server/db/schema";

const _30MIN = 60 * 30 * 1000

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

    const userSession = await requireUserSession(event)
    if(!userSession.user) throw createError({
        status: 403,
        message: 'Unauthorized',
    })

    const db = useDrizzle()
    const currentShorten = await db.query.urls.findFirst({
        where: and(
            eq(urls.uid, uid),
            gte(urls.expires, new Date())
        ),
        with: {
            UsersToUrls: {
                with: {
                    Users: true
                }
            }
        }
    })

    if(userSession.user.id != currentShorten?.UsersToUrls[0].user ?? 0) {
        throw createError({
            status: 404,
            message: 'Not found',
        })
    }

    const cachedData = await db.query.analyticsCache.findFirst({
        where: eq(analyticsCache.uid, uid),
    })
    if (cachedData && (cachedData.created_at!!).getTime() > Date.now() - _30MIN) {
        return JSON.parse(cachedData.data)
    }

    const data = await getFromAnalytics(
        `SELECT ${getParams([
            AKeys.ip, AKeys.country, AKeys.region, AKeys.city, AKeys.colo, AKeys.latitude, AKeys.longitude, AKeys.browser, AKeys.device, AKeys.language
        ])}, timestamp from ANALYTICS WHERE index1 = '${uid}' and timestamp >= toDateTime(${
            Math.round((currentShorten?.created_at ?? new Date()).getTime() / 1000)
        })`
    )

    await db.insert(analyticsCache).values({
        uid: uid,
        data: data
    })

    try {
        return JSON.parse(data)
    } catch (e) {
        throw createError({
            status: 400,
            message: 'Could not parse analytics',
        })
    }
})