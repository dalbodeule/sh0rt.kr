const config = useRuntimeConfig()

export interface ICloudflareRequests {
    type: string,
    name: string,
    value: string
}

const domains: { [key: string]: string } = {}
const zoneIds = config.domainZoneId.split(',')

config.domainZoneId.split(',').forEach((value, idx) => {
    domains[value] = zoneIds[idx];
})

export async function createCloudflareRecord(domain: string, data: ICloudflareRequests) {
    const url = `https://api.sh0rt.kr/zones/${domains[domain]}/dns_records`
    const body = {
        ...data,
        ttl: 1,
        proxied: false,
        comment: 'auto generated with apis'
    }
    body.name = `${body.name}.${domain}`

    if(body.name.startsWith('.'))
        body.name = body.name.slice(1)
    body.name = body.name.replace('..', '.')

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.domainApiToken}`
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const errorDetails = await response.json()
        console.log(errorDetails.errors[0])
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}

export async function updateCloudflareRecord(domain: string, data: ICloudflareRequests, cfid: string) {
    const url = `https://api.sh0rt.kr/zones/${domains[domain]}/dns_records/${cfid}`
    const body = {
        ...data,
        ttl: 1,
        proxied: false,
        comment: 'auto generated with apis'
    }
    body.name = `${body.name}.${domain}`

    if(body.name.startsWith('.'))
        body.name = body.name.slice(1)
    body.name = body.name.replace(/(\.+)$/gm, '.')

    console.log(body)

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.domainApiToken}`
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const errorDetails = await response.json()
        console.log(errorDetails.errors)
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}

export async function deleteCloudflareRecord(domain: string, cfid: string) {
    const url = `https://api.sh0rt.kr/zones/${domains[domain]}/dns_records/${cfid}`

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.domainApiToken}`
        },
    })

    if (!response.ok) {
        const errorDetails = await response.json()
        console.log(errorDetails.errors)
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}