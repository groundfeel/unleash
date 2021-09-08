import { IFeatureEnvironment } from '../model';
import { Store } from './store';

export interface FeatureEnvironmentKey {
    featureName: string;
    environment: string;
}

export interface IFeatureEnvironmentStore
    extends Store<IFeatureEnvironment, FeatureEnvironmentKey> {
    getAllFeatureEnvironments(): Promise<IFeatureEnvironment[]>;
    featureHasEnvironment(
        environment: string,
        featureName: string,
    ): Promise<boolean>;
    isEnvironmentEnabled(
        featureName: string,
        environment: string,
    ): Promise<boolean>;
    toggleEnvironmentEnabledStatus(
        environment: string,
        featureName: string,
        enabled: boolean,
    ): Promise<boolean>;
    getEnvironmentMetaData(
        environment: string,
        featureName: string,
    ): Promise<IFeatureEnvironment>;
    disconnectFeatures(environment: string, project: string): Promise<void>;
    removeEnvironmentForFeature(
        feature_name: string,
        environment: string,
    ): Promise<void>;
    connectEnvironmentAndFeature(
        feature_name: string,
        environment: string,
        enabled: boolean,
    ): Promise<void>;
    connectFeatures(environment: string, projectId: string): Promise<void>;
    connectFeatureToEnvironmentsForProject(
        featureName: string,
        project_id: string,
    ): Promise<void>;

    connectProject(environment: string, projectId: string): Promise<void>;
    disconnectProject(environment: string, projectId: string): Promise<void>;
}
