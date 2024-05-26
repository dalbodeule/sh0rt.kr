export default interface CF_Ray {
    clientTcpRtt: number,
    longitude: string,
    httpProtocol: string,
    tlsCipher: string,
    continent: string,
    asn: number,
    clientAcceptEncoding: string,
    country: string,
    verifiedBotCategory: string,
    tlsClientAuth: {
        certIssuerDNLegacy: string,
        certIssuerSKI: string,
        certSubjectDNRFC2253: string,
        certSubjectDNLegacy: string,
        certFingerprintSHA256: string,
        certNotBefore: string,
        certSKI: string,
        certSerial: string,
        certIssuerDN: string,
        certVerified: string,
        certNotAfter: string,
        certSubjectDN: string,
        certPresented: string,
        certRevoked: string,
        certIssuerSerial: string,
        certIssuerDNRFC2253: string,
        certFingerprintSHA1: string
    },
    tlsExportedAuthenticator: {
        clientFinished: string,
        clientHandshake: string,
        serverHandshake: string,
        serverFinished: string
    },
    tlsVersion: string,
    city: string,
    timezone: string,
    colo: string,
    tlsClientHelloLength: string,
    edgeRequestKeepAliveStatus: 1,
    postalCode: string,
    region: string,
    latitude: string,
    requestPriority: string,
    regionCode: string,
    asOrganization: string,
    tlsClientExtensionsSha1: string,
    tlsClientRandom: string,
    botManagement: {
        corporateProxy: false,
        verifiedBot: false,
        jsDetection: { passed: false },
        staticResource: false,
        detectionIds: {},
        score: 99
    }
}