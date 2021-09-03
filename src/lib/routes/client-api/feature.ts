import memoizee from 'memoizee';
import { Request, Response } from 'express';
import Controller from '../controller';
import { IUnleashServices } from '../../types/services';
import { IUnleashConfig } from '../../types/option';
import FeatureToggleServiceV2 from '../../services/feature-toggle-service-v2';
import { Logger } from '../../logger';
import { querySchema } from '../../schema/feature-schema';
import { IFeatureToggleQuery } from '../../types/model';
import NotFoundError from '../../error/notfound-error';

const version = 2;

export default class FeatureController extends Controller {
    private readonly logger: Logger;

    private featureToggleServiceV2: FeatureToggleServiceV2;

    private readonly cache: boolean;

    private cachedFeatures: any;

    constructor(
        {
            featureToggleServiceV2,
        }: Pick<IUnleashServices, 'featureToggleServiceV2'>,
        config: IUnleashConfig,
    ) {
        super(config);
        const { experimental } = config;
        this.featureToggleServiceV2 = featureToggleServiceV2;
        this.logger = config.getLogger('client-api/feature.js');
        this.get('/', this.getAll);
        this.get('/:featureName', this.getFeatureToggle);
        if (experimental && experimental.clientFeatureMemoize) {
            // @ts-ignore
            this.cache = experimental.clientFeatureMemoize.enabled;
            this.cachedFeatures = memoizee(
                (query) => this.featureToggleServiceV2.getClientFeatures(query),
                {
                    promise: true,
                    // @ts-ignore
                    maxAge: experimental.clientFeatureMemoize.maxAge,
                    normalizer(args) {
                        // args is arguments object as accessible in memoized function
                        return JSON.stringify(args[0]);
                    },
                },
            );
        }
    }

    async getAll(req: Request, res: Response): Promise<void> {
        const query = await this.prepQuery(req.query);
        let features;
        if (this.cache) {
            features = await this.cachedFeatures(query);
        } else {
            features = await this.featureToggleServiceV2.getClientFeatures(
                query,
            );
        }
        res.json({ version, features });
    }

    async prepQuery({
        tag,
        project,
        namePrefix,
        environment,
    }: IFeatureToggleQuery): Promise<IFeatureToggleQuery> {
        if (!tag && !project && !namePrefix) {
            return null;
        }
        const tagQuery = this.paramToArray(tag);
        const projectQuery = this.paramToArray(project);
        const query = await querySchema.validateAsync({
            tag: tagQuery,
            project: projectQuery,
            namePrefix,
            environment,
        });
        if (query.tag) {
            query.tag = query.tag.map((q) => q.split(':'));
        }
        return query;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    paramToArray(param: any) {
        if (!param) {
            return param;
        }
        return Array.isArray(param) ? param : [param];
    }

    async getFeatureToggle(
        req: Request<{ featureName: string }, any, any, any>,
        res: Response,
    ): Promise<void> {
        const name = req.params.featureName;
        const query = { namePrefix: name };
        const toggles = await this.featureToggleServiceV2.getClientFeatures(
            query,
        );
        const toggle = toggles.find((t) => t.name === name);
        if (!toggle) {
            throw new NotFoundError(`Could not find feature toggle ${name}`);
        }
        res.json(toggle).end();
    }
}

module.exports = FeatureController;
