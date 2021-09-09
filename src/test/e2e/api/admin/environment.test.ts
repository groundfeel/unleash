import dbInit from '../../helpers/database-init';
import getLogger from '../../../fixtures/no-logger';
import { setupApp } from '../../helpers/test-helper';

let app;
let db;

beforeAll(async () => {
    db = await dbInit('environment_api_serial', getLogger);
    app = await setupApp(db.stores);
});

afterAll(async () => {
    await app.destroy();
    await db.destroy();
});

test('Should be able to create an environment', async () => {
    const envName = 'environment-info';
    // Create environment
    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
            type: 'production',
        })
        .set('Content-Type', 'application/json')
        .expect(201);
});

test('Environment names must be URL safe', async () => {
    const envName = 'Something not url safe **/ */21312';
    // Create environment
    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
            type: 'production',
        })
        .set('Content-Type', 'application/json')
        .expect(400);
});

test('Can list all existing environments', async () => {
    await app.request
        .get('/api/admin/environments')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
            expect(res.body.version).toBe(1);
            expect(res.body.environments[0]).toStrictEqual({
                displayName: 'Across all environments',
                name: ':global:',
                enabled: true,
                sortOrder: 1,
                type: 'production',
                protected: true,
            });
        });
});

test('Can delete environment', async () => {
    const envName = 'deletable-info';
    // Create environment
    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
            type: 'production',
        })
        .set('Content-Type', 'application/json')
        .expect(201);
    await app.request.get(`/api/admin/environments/${envName}`).expect(200);
    await app.request.delete(`/api/admin/environments/${envName}`).expect(200);
    await app.request.get(`/api/admin/environments/${envName}`).expect(404);
});

test('Can update environment', async () => {
    const envName = 'update-env';
    // Create environment
    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
            type: 'production',
        })
        .set('Content-Type', 'application/json')
        .expect(201);
    await app.request.get(`/api/admin/environments/${envName}`).expect(200);
    await app.request
        .put(`/api/admin/environments/${envName}`)
        .send({ displayName: 'Update this' })
        .expect(200);
    await app.request
        .get(`/api/admin/environments/${envName}`)
        .expect((res) => {
            expect(res.body.displayName).toBe('Update this');
        });
});

test('Updating a non existing environment yields 404', async () => {
    const envName = 'non-existing-env';
    await app.request
        .put(`/api/admin/environments/${envName}`)
        .send({ displayName: 'Update this' })
        .expect(404);
});

test('Can update sort order', async () => {
    const envName = 'sort-order-env';

    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
            type: 'production',
        })
        .set('Content-Type', 'application/json')
        .expect(201);

    await app.request
        .put('/api/admin/environments/sort-order')
        .send({
            ':global:': 2,
            [envName]: 1,
        })
        .expect(200);

    await app.request
        .get('/api/admin/environments')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
            expect(res.body.environments[0].name).toBe(envName);
            expect(res.body.environments[0].sortOrder).toBe(1);

            expect(res.body.environments[1].name).toBe(':global:');
            expect(res.body.environments[1].sortOrder).toBe(2);
        });
});

test('Sort order will fail on wrong data format', async () => {
    const envName = 'sort-order-env';

    await app.request
        .put('/api/admin/environments/sort-order')
        .send({
            ':global:': 'test',
            [envName]: 1,
        })
        .expect(400);
});

test('Can update environment enabled status', async () => {
    const envName = 'update-env';

    await app.request
        .post(`/api/admin/environments/${envName}/on`)
        .set('Content-Type', 'application/json')
        .expect(204);
});

test('Can update environment disabled status', async () => {
    const envName = 'update-env';

    await app.request
        .post(`/api/admin/environments/${envName}/off`)
        .set('Content-Type', 'application/json')
        .expect(204);
});

test('Can not update non-existing environment enabled status', async () => {
    const envName = 'non-existing-env';

    await app.request
        .post(`/api/admin/environments/${envName}/on`)
        .set('Content-Type', 'application/json')
        .expect(404);
});

test('Can not update non-existing environment disabled status', async () => {
    const envName = 'non-existing-env';

    await app.request
        .post(`/api/admin/environments/${envName}/off`)
        .set('Content-Type', 'application/json')
        .expect(404);
});

test('Can not create environment that does not have unique id', async () => {
    const envName = 'update-env';
    // Create environment
    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
            type: 'production',
        })
        .set('Content-Type', 'application/json')
        .expect(409);
});

test('Can not create environment that does not have type', async () => {
    const envName = 'type-env';
    // Create environment
    await app.request
        .post('/api/admin/environments')
        .send({
            name: envName,
            displayName: 'Enable feature for environment',
        })
        .set('Content-Type', 'application/json')
        .expect(400);
});
