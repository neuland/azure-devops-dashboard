import * as Decoder from "io-ts/lib/Decoder";
import {AccessToken} from "azure/devops/react/authentication/AccessToken";
import {OrganizationName} from "azure/devops/api/_custom/organization/Organization";
import {bodyFromJson, rejectNonOk} from "azure/devops/api/_util/Response";
import {decode} from "decode";

const projectNameTag = Symbol("ProjectName");
export type ProjectName = string & { readonly _tag: typeof projectNameTag; };
const createProjectName: (value: string) => ProjectName = (value) => value as ProjectName;

export interface Project {
    readonly name: ProjectName;
}

const projectNameDecoder = Decoder.map(createProjectName)(Decoder.string);

const projectDecoder = Decoder.struct({
    name: projectNameDecoder,
});

const projectsResponseDecoder = Decoder.struct({
    value: Decoder.array(projectDecoder),
});

export const fetchProjects: (organizationName: OrganizationName, accessToken: AccessToken) => Promise<ReadonlyArray<Project>> =
    (organizationName, accessToken) =>
        fetch(`https://dev.azure.com/${organizationName}/_apis/projects?api-version=6.0`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then(rejectNonOk())
            .then(bodyFromJson())
            .then(decode(projectsResponseDecoder))
            .then(_ => _.value);
