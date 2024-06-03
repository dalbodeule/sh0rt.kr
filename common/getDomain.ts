const getDomain = (fullDomain: string) => {
    let domain = '';
    let tld = '';

    const domainParts = fullDomain.split('.');

    // Assuming TLD is the last two parts of the domain (e.g., example.com, example.co.uk)
    if (domainParts.length >= 2) {
      tld = domainParts.slice(-2).join('.');
      domain = domainParts.slice(0, -2).join('.');
    } else {
      tld = fullDomain;
    }

    return [domain, tld]
}

export default getDomain