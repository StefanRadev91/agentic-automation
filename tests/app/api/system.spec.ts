import { ApiEndpoints } from '../../../enums/app/app';
import {
    ConfigResponseSchema,
    HealthResponseSchema,
} from '../../../fixtures/api/schemas/app/systemSchema';
import { expect, test } from '../../../fixtures/pom/test-options';

test.describe('api/system', () => {
    test(
        'should report the API as healthy',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest({
                method: 'GET',
                url: ApiEndpoints.HEALTH,
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(200);
            expect(HealthResponseSchema.parse(body)).toBeTruthy();
        }
    );

    test(
        'should expose the public feature flags',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest({
                method: 'GET',
                url: ApiEndpoints.CONFIG,
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(200);
            expect(ConfigResponseSchema.parse(body)).toBeTruthy();
        }
    );
});
