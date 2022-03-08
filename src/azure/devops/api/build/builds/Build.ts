import * as Decoder from "io-ts/lib/Decoder";
import {OrganizationName} from "azure/devops/api/_custom/organization/Organization";
import {ProjectName} from "azure/devops/api/core/projects/Project";
import {AccessToken} from "azure/devops/react/authentication/AccessToken";
import {bodyFromJson, rejectNonOk} from "azure/devops/api/_util/Response";
import {decode} from "decode";

const buildIdTag = Symbol("BuildId");
export type BuildId = number & { readonly _tag: typeof buildIdTag; };
const createBuildId: (value: number) => BuildId = (value) => value as BuildId;

const buildStatusTag = Symbol("BuildStatus");
export type BuildStatus = string & { readonly _tag: typeof buildStatusTag; };
const createBuildStatus: (value: string) => BuildStatus = (value) => value as BuildStatus;

export const inProgress: BuildStatus = createBuildStatus("inProgress");

export interface Build {
    id: BuildId;
    status: BuildStatus;
}

const buildIdDecoder = Decoder.map(createBuildId)(Decoder.number);

const buildStatusDecoder = Decoder.map(createBuildStatus)(Decoder.string);

const buildDecoder = Decoder.struct({
    id: buildIdDecoder,
    status: buildStatusDecoder,
});

const buildsResponseDecoder = Decoder.struct({
    value: Decoder.array(buildDecoder),
});

export const fetchBuilds: (organizationName: OrganizationName, projectName: ProjectName, accessToken: AccessToken) => Promise<Array<Build>> =
    (organizationName, projectName, accessToken) =>
        fetch(`https://dev.azure.com/${organizationName}/${projectName}/_apis/build/builds?api-version=6.0`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then(rejectNonOk())
            .then(bodyFromJson())
            .then(decode(buildsResponseDecoder))
            .then(_ => _.value);
