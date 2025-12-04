export const isValidUrl = (url: string): boolean => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
        return false;
    }
};

export const validateSocialLink = (url: string, type: string): boolean => {
    if (!isValidUrl(url)) return false;

    const domainMap: Record<string, string> = {
        instagram: 'instagram.com',
        twitter: 'twitter.com',
        line: 'line.me',
        tiktok: 'tiktok.com',
        youtube: 'youtube.com',
    };

    if (domainMap[type]) {
        return url.includes(domainMap[type]) || url.includes('x.com'); // Allow x.com for twitter
    }

    return true;
};
