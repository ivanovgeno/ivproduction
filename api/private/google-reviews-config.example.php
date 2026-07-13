<?php
/**
 * Copy this file to google-reviews-config.php, fill in the values and keep the
 * real file private. Do not commit the real configuration file to GitHub.
 */
return [
    // Google Cloud OAuth 2.0 client for the Google Business Profile API.
    'google_client_id' => '',
    'google_client_secret' => '',
    'google_refresh_token' => '',

    // Numeric IDs from the Google Business Profile API path:
    // accounts/{ACCOUNT_ID}/locations/{LOCATION_ID}
    'google_business_account_id' => '',
    'google_business_location_id' => '',

    // Public links used by the website buttons (optional but recommended).
    'google_maps_url' => 'https://www.google.com/maps/search/?api=1&query=IV%20Production%20Hradec%20Kr%C3%A1lov%C3%A9',
    'google_write_review_url' => 'https://www.google.com/search?q=ivproduction+hradec+kralove&review=1',

    // The endpoint fetches fresh data at most once per period.
    'cache_ttl_seconds' => 21600,
];
