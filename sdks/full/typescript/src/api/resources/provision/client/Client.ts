/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as environments from "../../../../environments";
import * as core from "../../../../core";
import { Servers } from "../resources/servers/client/Client";

export declare namespace Provision {
    interface Options {
        environment?: core.Supplier<environments.RivetEnvironment | string>;
        token?: core.Supplier<core.BearerToken | undefined>;
        fetcher?: core.FetchFunction;
    }

    interface RequestOptions {
        timeoutInSeconds?: number;
        maxRetries?: number;
    }
}

export class Provision {
    constructor(protected readonly _options: Provision.Options = {}) {}

    protected _servers: Servers | undefined;

    public get servers(): Servers {
        return (this._servers ??= new Servers(this._options));
    }
}