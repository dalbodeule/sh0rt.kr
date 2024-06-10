// https://stackoverflow.com/a/64795218/11516704

export default async function sha256(key: string) {
    const text = new TextEncoder().encode(key)

    const digest = await crypto.subtle.digest('SHA-256', text)

    const hashArr = Array.from(new Uint8Array(digest))
    return hashArr.map(b => b.toString(16).padStart(2, '0')).join('')
}