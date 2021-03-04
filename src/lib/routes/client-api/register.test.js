'use strict';

const test = require('ava');
const supertest = require('supertest');
const { EventEmitter } = require('events');
const sinon = require('sinon');
const ClientMetricsService = require('../../services/client-metrics');
const store = require('../../../test/fixtures/store');
const getLogger = require('../../../test/fixtures/no-logger');
const getApp = require('../../app');
const { createServices } = require('../../services');

const eventBus = new EventEmitter();

function getSetup() {
    const stores = store.createStores();
    const config = {
        baseUriPath: '',
        stores,
        eventBus,
        getLogger,
    };
    const services = createServices(stores, config);
    const app = getApp(config, services);

    return {
        request: supertest(app),
        stores,
    };
}

test.afterEach(() => {
    getLogger.setMuteError(false);
});

test('should register client', t => {
    t.plan(0);
    const { request } = getSetup();
    return request
        .post('/api/client/register')
        .send({
            appName: 'demo',
            instanceId: 'test',
            strategies: ['default'],
            sdkVersion: 'unleash-client-test:1.2',
            started: Date.now(),
            interval: 10,
        })
        .expect(202);
});

test('should register client without sdkVersion', t => {
    t.plan(0);
    const { request } = getSetup();
    return request
        .post('/api/client/register')
        .send({
            appName: 'demo',
            instanceId: 'test',
            strategies: ['default'],
            started: Date.now(),
            interval: 10,
        })
        .expect(202);
});

test('should require appName field', t => {
    t.plan(0);
    const { request } = getSetup();
    return request
        .post('/api/client/register')
        .set('Content-Type', 'application/json')
        .expect(400);
});

test('should require strategies field', t => {
    t.plan(0);
    const { request } = getSetup();
    return request
        .post('/api/client/register')
        .send({
            appName: 'demo',
            instanceId: 'test',
            // strategies: ['default'],
            started: Date.now(),
            interval: 10,
        })
        .expect(400);
});

test('should fail if store fails', t => {
    t.plan(0);
    getLogger.setMuteError(true);

    // --- start custom config
    const stores = store.createStores();
    stores.clientApplicationsStore = {
        upsert: () => {
            throw new Error('opps');
        },
    };
    const app = getApp({
        baseUriPath: '',
        stores,
        eventBus,
        getLogger,
    });
    // --- end custom config

    const request = supertest(app);

    return request
        .post('/api/client/register')
        .send({
            appName: 'demo',
            instanceId: 'test',
            strategies: ['default'],
            started: Date.now(),
            interval: 10,
        })
        .expect(500);
});

test('should store event as well as app and instance', async t => {
    const clock = sinon.useFakeTimers();
    const stores = store.createStores();
    stores.clientApplicationsStore = {
        bulkUpsert: sinon.fake(),
    };
    stores.clientInstanceStore = {
        bulkUpsert: sinon.fake(),
    };
    const eventSpy = sinon.spy();
    stores.eventStore = {
        batchStore: eventSpy,
    };
    const clientMetricsService = new ClientMetricsService(stores, {
        getLogger,
        bulkInterval: 1000,
    });
    const app = getApp(
        {
            baseUriPath: '',
            stores,
            eventBus,
            getLogger,
        },
        { clientMetricsService },
    );

    const request = supertest(app);
    const client = {
        appName: 'event_store_testing',
        instanceId: 'test',
        strategies: ['default'],
        started: Date.now(),
        interval: 10,
    };
    await request
        .post('/api/client/register')
        .send(client)
        .expect(202);
    await clock.tickAsync(1500);
    t.is(eventSpy.callCount, 1);
    t.is(eventSpy.firstCall.args.length, 1);
    t.is(eventSpy.firstCall.args[0][0].data.appName, client.appName);

    clock.restore();
});
