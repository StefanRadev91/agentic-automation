/**
 * auth-api.setup.ts
 * Playwright setup script for the API test account (`setup-api` project).
 *
 * Registers a fresh EventHub account over HTTP and saves its credentials and
 * JWT, so the `api` project never needs a browser and the UI setup can sign
 * the same account in. Each run gets its own isolated sandbox.
 */

import { expect, test } from '../../fixtures/pom/test-options';
import { registerTestUser } from '../../helpers/app/createStorageState';

test.describe('auth setup - API', () => {
    test('setup authentication - register test account', async ({
        apiRequest,
    }) => {
        await registerTestUser(apiRequest);
        expect(process.env['ACCESS_TOKEN']).toBeDefined();
    });
});
