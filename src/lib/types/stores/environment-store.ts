import { IEnvironment, IEnvironmentCreate } from '../model';
import { Store } from './store';

export interface IEnvironmentStore extends Store<IEnvironment, string> {
    exists(name: string): Promise<boolean>;
    create(env: IEnvironmentCreate): Promise<IEnvironment>;
    update(
        env: Pick<IEnvironment, 'displayName' | 'type' | 'protected'>,
        name: string,
    ): Promise<IEnvironment>;
    updateProperty(
        id: string,
        field: string,
        value: string | number | boolean,
    ): Promise<void>;
    updateSortOrder(id: string, value: number);
    connectProject(environment: string, projectId: string): Promise<void>;
    connectFeatures(environment: string, projectId: string): Promise<void>;
    disconnectProjectFromEnv(
        environment: string,
        projectId: string,
    ): Promise<void>;
    connectFeatureToEnvironmentsForProject(
        featureName: string,
        project_id: string,
    ): Promise<void>;
}
