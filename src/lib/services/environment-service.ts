import { IUnleashStores } from '../types/stores';
import { IUnleashConfig } from '../types/option';
import { Logger } from '../logger';
import { IEnvironment, IEnvironmentCreate, ISortOrder } from '../types/model';
import { UNIQUE_CONSTRAINT_VIOLATION } from '../error/db-error';
import NameExistsError from '../error/name-exists-error';
import {
    environmentSchema,
    sortOrderSchema,
    updateEnvironmentSchema,
} from './state-schema';
import NotFoundError from '../error/notfound-error';
import { IEnvironmentStore } from '../types/stores/environment-store';
import { IFeatureStrategiesStore } from '../types/stores/feature-strategies-store';
import { IFeatureEnvironmentStore } from '../types/stores/feature-environment-store';

export default class EnvironmentService {
    private logger: Logger;

    private environmentStore: IEnvironmentStore;

    private featureStrategiesStore: IFeatureStrategiesStore;

    private featureEnvironmentStore: IFeatureEnvironmentStore;

    constructor(
        {
            environmentStore,
            featureStrategiesStore,
            featureEnvironmentStore,
        }: Pick<
            IUnleashStores,
            | 'environmentStore'
            | 'featureStrategiesStore'
            | 'featureEnvironmentStore'
        >,
        { getLogger }: Pick<IUnleashConfig, 'getLogger'>,
    ) {
        this.logger = getLogger('services/environment-service.ts');
        this.environmentStore = environmentStore;
        this.featureStrategiesStore = featureStrategiesStore;
        this.featureEnvironmentStore = featureEnvironmentStore;
    }

    async getAll(): Promise<IEnvironment[]> {
        return this.environmentStore.getAll();
    }

    async get(name: string): Promise<IEnvironment> {
        return this.environmentStore.get(name);
    }

    async delete(name: string): Promise<void> {
        return this.environmentStore.delete(name);
    }

    async create(env: IEnvironmentCreate): Promise<IEnvironment> {
        await environmentSchema.validateAsync(env);
        return this.environmentStore.create(env);
    }

    async validateUniqueEnvName(name: string): Promise<void> {
        let msg;

        try {
            const env = await this.environmentStore.get(name);
            if (env) {
                msg = `Environment ${name} already exists`;
            }
        } catch (e) {
            return;
        }

        throw new NameExistsError(msg);
    }

    async updateSortOrder(sortOrder: ISortOrder): Promise<void> {
        await sortOrderSchema.validateAsync(sortOrder);
        Object.keys(sortOrder).forEach(async (key) => {
            const value = sortOrder[key];
            await this.environmentStore.updateSortOrder(key, value);
        });
    }

    async toggleEnvironment(name: string, value: boolean): Promise<void> {
        const exists = await this.environmentStore.exists(name);
        if (exists) {
            return this.environmentStore.updateProperty(name, 'enabled', value);
        }
        throw new NotFoundError(`Could not find environment ${name}`);
    }

    async update(
        name: string,
        env: Omit<IEnvironment, 'name' | 'enabled' | 'protected'>,
    ): Promise<IEnvironment> {
        await updateEnvironmentSchema.validateAsync(env);
        const exists = await this.environmentStore.exists(name);

        if (exists) {
            return this.environmentStore.update(
                { ...env, protected: false },
                name,
            );
        }
        throw new NotFoundError(`Could not find environment ${name}`);
    }

    async connectProjectToEnvironment(
        environment: string,
        projectId: string,
    ): Promise<void> {
        try {
            await this.environmentStore.connectProject(environment, projectId);
            await this.environmentStore.connectFeatures(environment, projectId);
        } catch (e) {
            if (e.code === UNIQUE_CONSTRAINT_VIOLATION) {
                throw new NameExistsError(
                    `${projectId} already has the environment ${environment} enabled`,
                );
            }
            throw e;
        }
    }

    async removeEnvironmentFromProject(
        environment: string,
        projectId: string,
    ): Promise<void> {
        await this.featureEnvironmentStore.disconnectEnvironmentFromProject(
            environment,
            projectId,
        );
        await this.environmentStore.disconnectProjectFromEnv(
            environment,
            projectId,
        );
    }
}
