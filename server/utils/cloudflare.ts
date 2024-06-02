const config = useRuntimeConfig()

export async function createCloudflareRecord(domain: string, type: string, name: string, value: string) {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.domainZoneId}/dns_records`
    const body = {
        type,
        name: `${name}.${domain}`,
        content: value,
        ttl: 1,
        proxied: false,
        comment: 'auto generated with apis'
    }

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
        const errorDetails = await response.json()
        console.log(errorDetails.errors[0])
        throw new Error(`Failed to create Cloudflare record ${errorDetails.errors[0].message}`)
    }

    return await response.json()
}

export async function updateCloudflareRecord(domain: string, type: string, name: string, value: string, cfid: string) {
    const url = `https://api.cloudflare.com/client/v4/zones/${config.domainZoneId}/dns_records/${cfid}`
    const body = {
        type,
        name: `${name}.${domain}`,
        content: value,
        ttl: 1,
        proxied: false,
        comment: 'auto generated with apis'
    }

    if(body.name.startsWith('.'))
        body.name = body.name.slice(1)

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