import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { ApiEndpoints, StorageStatePaths } from '../../enums/app/app';
import { LoginPage } from '../../pages/app/login.page';
import { ApiRequestFn } from '../../fixtures/api/api-types';
import {
    AuthResponse,
    AuthResponseSchema,
    TestUser,
    TestUserSchema,
} from '../../fixtures/api/schemas/app/authSchema';
import { generateCredentials } from '../../test-data/factories/app/user.factory';

/**
 * Reads the throwaway test account written by `registerTestUser()`.
 *
 * @returns {TestUser} The validated account (email, password, token, userId).
 * @throws {Error} When the `setup-api` project has not produced the file yet.
 */
export function loadTestUser(): TestUser {
    const raw: unknown = JSON.parse(
        fs.readFileSync(StorageStatePaths.TEST_USER, 'utf-8')
    );
    return TestUserSchema.parse(raw);
}

/**
 * Registers a fresh account over HTTP and persists it for every worker.
 *
 * EventHub gives every account an isolated sandbox, so each run creates its
 * own user: no shared credentials, nothing to store as a CI secret. The file
 * is what crosses the worker boundary; `process.env.ACCESS_TOKEN` is also set
 * for code running in the setup worker itself.
 *
 * @param {ApiRequestFn} apiRequest - The API request function from fixtures.
 * @returns {Promise<void>} Resolves when the account file is written.
 *
 * @example
 * test('setup API authentication', async ({ apiRequest }) => {
 *     await registerTestUser(apiRequest);
 * });
 */
export async function registerTestUser(
    apiRequest: ApiRequestFn
): Promise<void> {
    const credentials = generateCredentials();

    const { status, body } = await apiRequest<AuthResponse>({
        method: 'POST',
        url: ApiEndpoints.REGISTER,
        baseUrl: process.env.API_URL,
        body: credentials,
    });

    expect(status).toBe(201);
    expect(AuthResponseSchema.parse(body)).toBeTruthy();

    const testUser: TestUser = {
        ...credentials,
        token: body.token,
        userId: body.user.id,
    };

    fs.mkdirSync(path.dirname(StorageStatePaths.TEST_USER), {
        recursive: true,
    });
    fs.writeFileSync(
        StorageStatePaths.TEST_USER,
        JSON.stringify(testUser, null, 2)
    );

    process.env['ACCESS_TOKEN'] = testUser.token;
}

/**
 * Loads the token saved by `registerTestUser()` into `process.env.ACCESS_TOKEN`
 * for the current worker process. Called once per worker by the `apiRequest`
 * fixture file. A missing file is not an error: the `setup-api` project itself
 * simply leaves the variable unset.
 *
 * @returns {void}
 */
export function loadUserAccessToken(): void {
    if (!fs.existsSync(StorageStatePaths.TEST_USER)) return;

    process.env['ACCESS_TOKEN'] = loadTestUser().token;
}

/**
 * Signs the test account in through the browser and saves the storage state
 * (localStorage with the session token), so UI tests start authenticated.
 * Requires `registerTestUser()` to have run first (`setup-api` project).
 *
 * @returns {Promise<void>} Resolves when the storage state is saved.
 */
export async function createAppStorageState(): Promise<void> {
    const { email, password } = loadTestUser();

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.openLoginPage();
    await loginPage.loginAndVerify(email, password);

    await context.storageState({ path: StorageStatePaths.APP });
    await browser.close();
}
