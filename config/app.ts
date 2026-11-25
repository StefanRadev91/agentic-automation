/**
 * Application configuration object.
 * Contains URL configuration for the main application.
 *
 * For route paths and API endpoints, use enums from `enums/app/app.ts`.
 */
export const appConfig = {
    /** Frontend application URL loaded from the APP_URL env variable */
    appUrl: process.env.APP_URL!,
    /** Backend API URL loaded from the API_URL env variable */
    apiUrl: process.env.API_URL!,
    /**
     * How many times Playwright retries an API call that fails with a dropped
     * connection (ECONNRESET). The public EventHub server closes idle
     * keep-alive sockets, which would otherwise fail a teardown call that
     * runs after a long UI interaction.
     */
    apiNetworkRetries: 3,
};
