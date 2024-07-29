import {H3Event} from "h3";

export enum AKeys {
    ip = 'ip',
    country = 'country',
    region = 'region',
    city = 'city',
    colo = 'colo',
    latitude = 'latitude',
    longitude = 'longitude',
    browser = 'browser',
    device = 'device',
    language = 'language',
}

const keys = [
    AKeys.ip,
    AKeys.country,
    AKeys.region,
    AKeys.city,
    AKeys.colo,
    AKeys.latitude,
    AKeys.longitude,
    AKeys.browser,
    AKeys.device,
    AKeys.language,
]

export interface IAnalyticObject {
    ip: string | undefined,
    country: string | undefined,
    region: string | undefined,
    city: string | undefined,
    colo: string | undefined,
    latitude: string | undefined,
    longitude: string | undefined,
    browser: string | undefined,
    device: string | undefined,
    language: string | undefined,
}

export function objectToArray(object: IAnalyticObject): string[] {
    return Object.values(object)
}

export function arrayToObject(arr: string[]): IAnalyticObject {
    const object: IAnalyticObject | {[key: string]: string} = {}
    keys.reduce((obj, key, index) => {
        obj[key] = arr[index]
        return obj
    }, object)

    return (object as unknown) as IAnalyticObject
}

export async function getFromAnalytics(query: string, event: H3Event) {
    const config = useRuntimeConfig(event)
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.analyticsAccountId}/analytics_engine/sql`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.analyticsApiToken}`,
        },
        body: query
    })
    return await response.text()
}

export function getParams(data: AKeys[]): string {
    const blobMappings = data.map(key => {
        // 배열 `keys`에서 key의 인덱스를 찾고, 이 인덱스에 1을 더해 blob 번호를 결정합니다.
        const index = keys.indexOf(key) + 1; // `+1`은 인덱스를 1 기반으로 만듭니다.
        return `blob${index} as ${key}`; // `blob{index} as {key}` 형식으로 문자열을 구성합니다.
    });

    // 배열을 쉼표로 구분된 하나의 문자열로 합칩니다.
    return blobMappings.join(', ');
}