import { Request, Response } from 'express';
import Controller from '../controller';
import { IUnleashServices } from '../../types/services';
import { IUnleashConfig } from '../../types/option';
import { IEnvironment, ISortOrder } from '../../types/model';
import EnvironmentService from '../../services/environment-service';
import { Logger } from '../../logger';
import { handleErrors } from '../util';
import { ADMIN } from '../../types/permissions';

interface EnvironmentParam {
    name: string;
}

export class EnvironmentsController extends Controller {
    private logger: Logger;

    private service: EnvironmentService;

    constructor(
        config: IUnleashConfig,
        { environmentService }: Pick<IUnleashServices, 'environmentService'>,
    ) {
        super(config);
        this.logger = config.getLogger('admin-api/environments-controller.ts');
        this.service = environmentService;
        this.get('/', this.getAll);
        this.post('/', this.createEnv, ADMIN);
        this.post('/validate', this.validateEnvName);
        this.put('/sort-order', this.updateSortOrder);
        this.get('/:name', this.getEnv);
        this.put('/:name', this.updateEnv, ADMIN);
        this.delete('/:name', this.deleteEnv, ADMIN);
        this.post('/:name/on', this.toggleEnvironmentOn);
        this.post('/:name/off', this.toggleEnvironmentOff);
    }

    async getAll(req: Request, res: Response): Promise<void> {
        try {
            const environments = await this.service.getAll();
            res.status(200).json({ version: 1, environments });
        } catch (e) {
            handleErrors(res, this.logger, e);
        }
    }

    async createEnv(
        req: Request<any, any, IEnvironment, any>,
        res: Response,
    ): Promise<void> {
        try {
            await this.service.validateUniqueEnvName(req.body.name);
            const environment = await this.service.create(req.body);
            res.status(201).json(environment);
        } catch (e) {
            handleErrors(res, this.logger, e);
        }
    }

    async updateSortOrder(
        req: Request<any, any, ISortOrder, any>,
        res: Response,
    ): Promise<void> {
        await this.service.updateSortOrder(req.body);
        res.status(200).end();
    }

    async toggleEnvironmentOn(
        req: Request<any, any, any, any>,
        res: Response,
    ): Promise<void> {
        const { name } = req.body;
        await this.service.toggleEnvironment(name, true);
        res.status(204).end();
    }

    async toggleEnvironmentOff(
        req: Request<any, any, any, any>,
        res: Response,
    ): Promise<void> {
        const { name } = req.body;
        await this.service.toggleEnvironment(name, false);
        res.status(204).end();
    }

    async validateEnvName(req: Request, res: Response): Promise<void> {
        const { name } = req.body;

        if (!name) {
            res.status(400).end();
            return;
        }

        await this.service.validateUniqueEnvName(name);
        res.status(200).end();
    }

    async getEnv(
        req: Request<EnvironmentParam, any, any, any>,
        res: Response,
    ): Promise<void> {
        const { name } = req.params;
        try {
            const env = await this.service.get(name);
            res.status(200).json(env);
        } catch (e) {
            handleErrors(res, this.logger, e);
        }
    }

    async updateEnv(
        req: Request<EnvironmentParam, any, IEnvironment, any>,
        res: Response,
    ): Promise<void> {
        const { name } = req.params;
        try {
            const env = await this.service.update(name, req.body);
            res.status(200).json(env);
        } catch (e) {
            handleErrors(res, this.logger, e);
        }
    }

    async deleteEnv(
        req: Request<EnvironmentParam, any, any, any>,
        res: Response,
    ): Promise<void> {
        const { name } = req.params;
        try {
            await this.service.delete(name);
            res.status(200).end();
        } catch (e) {
            handleErrors(res, this.logger, e);
        }
    }
}
