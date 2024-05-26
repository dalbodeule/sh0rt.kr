import { H3Event } from "h3"
import putAccessLog from "~/server/utils/putAccessLog"
import UAParser from 'ua-parser-js'
import parser from 'accept-language-parser'
import {IAnalyticObject, objectToArray} from "~/server/utils/analyticHelper";

export default defineEventHandler(async(event: H3Event) => {
    const uid = getRouterParam(event, 'uid') ?? ''
    if(!uid) throw createError({
        status: 404,
        message: 'Not found',
    })

    const ip = getHeader(event, 'X-Real-IP') ?? getRequestIP(event, { xForwardedFor: true })
    const userAgent = new UAParser(getHeader(event, 'user-agent') ?? '')
    const language = parser.parse(getHeader(event, 'accept-language') ?? '')

    const accessLog = await putAccessLog(event)

    const objects: IAnalyticObject =  {
        ip,
        country: accessLog.country,
        region: accessLog.region,
        city: accessLog.city,
        colo: accessLog.colo,
        latitude: accessLog.latitude,
        longitude: accessLog.longitude,
        browser: userAgent.getBrowser().name,
        device: userAgent.getDevice().model,
        language: language[0].code
    }


    if(process.dev)
        console.log([...objectToArray(objects)])
    else {
        return hubAnalytics().put({
            indexes: [uid],
            blobs: [...objectToArray(objects)],
        })
    }

    return true
})