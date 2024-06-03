import type {H3Event} from "h3";
import { AKeys, getFromAnalytics, getParams } from "~/server/utils/analyticHelper";
import { useDrizzle } from "~/server/utils/useDrizzle";
import { and, eq, gte } from "drizzle-orm";
import { analyticsCache, urls } from "~/server/db/schema";
import { lte } from "drizzle-orm/expressions";

const _30MIN = 60 * 30 * 1000

export interface IAnalytics {
    meta: { name: string, type: string }[],
    data: { ip: string, country: string, region: string, city: string, colo: string, latitude: string,
        longitude: string, browser: string, device: string, language: string, timestmap: string }[],
    rows: number,
    rows_before_limit_as_least: number
}

export interface IAnalyticsResponse {
    [key: string]: [string, string|number][]
}

const aggregateDataByField = (response: IAnalytics, field: string, fieldName: string): [string, string|number][] => {
    const dataCount: { [key: string]: number } = {};
    const data: [string, string|number][] = [[fieldName, field]]

    response.data.forEach(item => {
        const fieldValue = (item as unknown as {[key: string]: number})[field]
        if (dataCount[fieldValue]) {
            dataCount[fieldValue]++;
        } else {
            dataCount[fieldValue] = 1;
        }
    });

    // 객체를 배열로 변환하여 반환합니다.
    const p: [string, string|number][] = Object.entries(dataCount).map(([key, value]) => [key, value]) as [string, string|number][]
    return data.concat(p);
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

    if(userSession.user.id != currentShorten?.UsersToUrls[0].user) {
        throw createError({
            status: 404,
            message: 'Not found',
        })
    }

    await db.delete(analyticsCache).where(
        lte(analyticsCache.created_at, new Date(Date.now() - _30MIN))
    )

    const cachedData = await db.query.analyticsCache.findFirst({
        where: eq(analyticsCache.uid, uid),
    })
    if (cachedData) {
        return JSON.parse(cachedData.data)
    }

    const data = await getFromAnalytics(
        `SELECT ${getParams([
            AKeys.ip, AKeys.country, AKeys.region, AKeys.city, AKeys.colo, AKeys.latitude, AKeys.longitude, AKeys.browser, AKeys.device, AKeys.language
        ])}, timestamp from ANALYTICS WHERE index1 = '${uid}' and timestamp >= toDateTime(${
            Math.round((currentShorten?.created_at ?? new Date()).getTime() / 1000)
        })`
    )

    try {
        const parsedData = JSON.parse(data) as IAnalytics

        const countryData = aggregateDataByField(parsedData, 'country', 'Country')
        const browserData = aggregateDataByField(parsedData, 'browser', 'Browser')
        const languageData = aggregateDataByField(parsedData, 'language', 'Language')
        const deviceData = aggregateDataByField(parsedData, 'device', 'Device')

        const returnData = { country: countryData, browser: browserData, language: languageData, device: deviceData }

        await db.insert(analyticsCache).values({
            uid: uid,
            data: JSON.stringify(returnData)
        })

        return returnData
    } catch (e) {
        throw createError({
            status: 400,
            message: 'Could not parse analytics',
        })
    }
})