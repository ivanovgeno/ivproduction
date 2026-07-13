import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'GOOGLE_BUSINESS_ACCOUNT_ID',
    'GOOGLE_BUSINESS_LOCATION_ID'
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
    throw new Error(`Missing required GitHub Secrets: ${missing.join(', ')}`);
}

const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const outputFile = 'google-reviews.json';

function rating(value) {
    if (typeof value === 'number') return Math.max(0, Math.min(5, value));
    return ratingMap[String(value || '').toUpperCase()] || Number(value) || 0;
}

async function request(url, options = {}) {
    const response = await fetch(url, options);
    const body = await response.text();
    let data = {};

    try {
        data = body ? JSON.parse(body) : {};
    } catch {
        // The status below is enough; never print a response that could expose
        // details not intended for the workflow log.
    }

    if (!response.ok) {
        const reason = typeof data.error?.message === 'string' ? data.error.message : response.statusText;
        throw new Error(`Google API request failed (${response.status}): ${reason}`);
    }

    return data;
}

async function getAccessToken() {
    const body = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token'
    });

    const token = await request('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });

    if (!token.access_token) throw new Error('Google OAuth did not return an access token.');
    return token.access_token;
}

function publicReview(review) {
    const reviewer = review.reviewer && typeof review.reviewer === 'object' ? review.reviewer : {};
    const reviewReply = review.reviewReply && typeof review.reviewReply === 'object' ? review.reviewReply : {};

    return {
        reviewId: String(review.reviewId || ''),
        rating: rating(review.starRating),
        comment: String(review.comment || ''),
        createTime: String(review.createTime || ''),
        updateTime: String(review.updateTime || ''),
        reviewer: {
            displayName: String(reviewer.displayName || 'Google uživatel'),
            profilePhotoUrl: String(reviewer.profilePhotoUrl || '')
        },
        reviewReply: {
            comment: String(reviewReply.comment || ''),
            updateTime: String(reviewReply.updateTime || '')
        }
    };
}

async function getReviews(accessToken) {
    const accountId = encodeURIComponent(process.env.GOOGLE_BUSINESS_ACCOUNT_ID);
    const locationId = encodeURIComponent(process.env.GOOGLE_BUSINESS_LOCATION_ID);
    const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
    const reviews = [];
    let pageToken = '';
    let averageRating = 0;
    let reviewCount = 0;

    for (let page = 0; page < 100; page += 1) {
        const query = new URLSearchParams({ pageSize: '50', orderBy: 'updateTime desc' });
        if (pageToken) query.set('pageToken', pageToken);

        const data = await request(`${endpoint}?${query}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (page === 0) {
            averageRating = rating(data.averageRating);
            reviewCount = Number(data.totalReviewCount) || 0;
        }
        if (Array.isArray(data.reviews)) reviews.push(...data.reviews.map(publicReview));

        pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
        if (!pageToken) break;
    }

    return {
        status: 'ok',
        generatedBy: 'github-actions',
        updatedAt: new Date().toISOString(),
        rating: averageRating,
        reviewCount: reviewCount || reviews.length,
        reviews
    };
}

const accessToken = await getAccessToken();
const payload = await getReviews(accessToken);
const temporaryFile = `${outputFile}.tmp`;

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(temporaryFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
await rename(temporaryFile, outputFile);
console.log(`Prepared ${payload.reviewCount} Google reviews for publication.`);
