/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../..";
import * as Rivet from "../../../../../../api";
import * as core from "../../../../../../core";

export const GlobalEventIdentityUpdate: core.serialization.ObjectSchema<
    serializers.identity.GlobalEventIdentityUpdate.Raw,
    Rivet.identity.GlobalEventIdentityUpdate
> = core.serialization.object({
    identity: core.serialization.lazyObject(async () => (await import("../../../../..")).identity.Profile),
});

export declare namespace GlobalEventIdentityUpdate {
    interface Raw {
        identity: serializers.identity.Profile.Raw;
    }
}