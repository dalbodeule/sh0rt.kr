import getDomain from "~/common/getDomain";

const config = useRuntimeConfig()

export interface ICloudflareRequests {
    type: string,
    name: string,
    value: string
}

const domains: { [key: string]: string } = {}
const zoneIds = config.domainZoneId.split(',')

config.public.domainList.split(',').forEach((value, idx) => {
    domains[value.replaceAll('\'', '')] = zoneIds[idx].replaceAll('\'', '');
})

export async function createCloudflareRecord(domain: string, data: ICloudflareRequests) {
    const [ _subdomain, tld ] = getDomain(domain)
    console.log(tld, domains[tld])

    const url = `https://api.sh0rt.kr/zones/${domains[tld]}/dns_records`
    const body = {
        ...data,
        ttl: 1,
        proxied: false,
        comment: 'auto generated with apis'
    }
    body.name = `${body.name}.${domain}.`
    body.name = body.name.replace('..', '.')
    if(body.name.startsWith('.'))
        body.name = body.name.slice(1)

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.domainApiToken}`
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const errors = await response.text()
        const errorDetails = JSON.parse(errors)
        console.log(errorDetails)
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}

export async function updateCloudflareRecord(domain: string, data: ICloudflareRequests, cfid: string) {
    const [ _subdomain, tld ] = getDomain(domain)
    console.log(tld, domains[tld])

    const url = `https://api.sh0rt.kr/zones/${domains[tld]}/dns_records/${cfid}`
    const body = {
        ...data,
        ttl: 1,
        proxied: false,
        comment: 'auto generated with apis'
    }
    body.name = `${body.name}.${domain}.`
    body.name = body.name.replace('..', '.')
    if(body.name.startsWith('.'))
        body.name = body.name.slice(1)

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
        const errors = await response.text()
        const errorDetails = JSON.parse(errors)
        console.log(errorDetails.errors)
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}

export async function deleteCloudflareRecord(domain: string, cfid: string) {
    const [ _subdomain, tld ] = getDomain(domain)
    console.log(tld, domains[tld])

    const url = `https://api.sh0rt.kr/zones/${domains[tld]}/dns_records/${cfid}`

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.domainApiToken}`
        },
    })

    if (!response.ok) {
        const errors = await response.text()
        const errorDetails = JSON.parse(errors)
        console.log(errorDetails.errors)
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}