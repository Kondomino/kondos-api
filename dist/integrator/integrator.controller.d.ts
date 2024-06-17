import { IntegratorService } from './integrator.service';
export declare class IntegratorController {
    private readonly integratorService;
    constructor(integratorService: IntegratorService);
    run(): Promise<string>;
}
