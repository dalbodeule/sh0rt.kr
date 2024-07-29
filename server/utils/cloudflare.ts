import getDomain from "~/common/getDomain";
import type {H3Event} from "h3";

export interface ICloudflareRequests {
    type: string,
    name: string,
    value: string
}

const props: {
    backend: string,
    domainApiToken: string,
    domains: { [key: string]: string },
    zoneIds: string[]
    domainList: string[]
} = { backend: "", domainApiToken: "", domains: {}, zoneIds: [], domainList: []}

const updateDomains = (event: H3Event) => {
    const config = useRuntimeConfig(event)

    if(Object.keys(props.domains).length > 0) return

    props.backend = config.apiBackend
    props.domainApiToken = config.domainApiToken

    props.zoneIds = (config.domainZoneId ?? "").split(',').map(id => id.trim());
    props.domainList = (config.public.domainList ?? "").split(',').map(domain => domain.trim());

    if (props.domainList.length !== props.zoneIds.length) {
        throw new Error("Mismatched domain and zone ID counts");
    }

    props.domainList.forEach((value, idx) => {
        props.domains[value] = props.zoneIds[idx];
    })
}

export async function createCloudflareRecord(domain: string, data: ICloudflareRequests, event: H3Event) {
    updateDomains(event)
    const [ _subdomain, tld ] = getDomain(domain)
    console.log(tld, props.domains[tld])

    const url = `${props.backend}/zones/${props.domains[tld]}/dns_records`
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
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${props.domainApiToken}`
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const errors = await response.text()
        let errorDetails
        try {
            errorDetails = JSON.parse(errors)
            console.log(errorDetails.errors)
        } catch(e) { console.log(e) }
        throw new Error(`Failed to create Cloudflare record ${errorDetails?.errors[0]?.message ?? ""} / ${props.backend}`)
    }

    return await response.json()
}

export async function updateCloudflareRecord(domain: string, data: ICloudflareRequests, cfid: string, event: H3Event) {
    updateDomains(event)
    const [ _subdomain, tld ] = getDomain(domain)
    console.log(tld, props.domains[tld])

    const url = `${props.backend}/zones/${props.domains[tld]}/dns_records/${cfid}`
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
            'Authorization': `Bearer ${props.domainApiToken}`
        },
        body: JSON.stringify(body)
    })

    if (!response.ok) {
        const errors = await response.text()
        let errorDetails
        try {
            errorDetails = JSON.parse(errors)
            console.log(errorDetails.errors)
        } catch(e) { console.log(e) }
        throw new Error(`Failed to update Cloudflare record ${errorDetails?.errors[0]?.message ?? ""} / ${props.backend}`)
    }

    return await response.json()
}

export async function deleteCloudflareRecord(domain: string, cfid: string, event: H3Event) {
    updateDomains(event)
    const [ _subdomain, tld ] = getDomain(domain)
    console.log(tld, props.domains[tld])

    const url = `${props.backend}/zones/${props.domains[tld]}/dns_records/${cfid}`

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${props.domainApiToken}`
        },
    })

    if (!response.ok) {
        const errors = await response.text()
        let errorDetails
        try {
            errorDetails = JSON.parse(errors)
            console.log(errorDetails.errors)
        } catch(e) { console.log(e) }
        throw new Error(`Failed to delete Cloudflare record ${errorDetails?.errors[0]?.message ?? ""} / ${props.backend}`)
    }

    return await response.json()
}