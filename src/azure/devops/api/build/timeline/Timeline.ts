import * as Decoder from "io-ts/lib/Decoder";
import {OrganizationName} from "azure/devops/api/_custom/organization/Organization";
import {ProjectName} from "azure/devops/api/core/projects/Project";
import {AccessToken} from "azure/devops/react/authentication/AccessToken";
import {BuildId} from "azure/devops/api/build/builds/Build";
import {bodyFromJson, rejectNonOk} from "azure/devops/api/_util/Response";
import {decode} from "decode";

const timelineRecordId = Symbol("TimelineRecordId");
export type TimelineRecordId = string & { readonly _tag: typeof timelineRecordId; };
const createTimelineRecordId: (value: string) => TimelineRecordId = (value) => value as TimelineRecordId;

const timelineRecordTypeTag = Symbol("TimelineRecordType");
export type TimelineRecordType = string & { readonly _tag: typeof timelineRecordTypeTag; };
const createTimelineRecordType: (value: string) => TimelineRecordType = (value) => value as TimelineRecordType;

const timelineRecordNameTag = Symbol("TimelineRecordName");
export type TimelineRecordName = string & { readonly _tag: typeof timelineRecordNameTag; };
const createTimelineRecordName: (value: string) => TimelineRecordName = (value) => value as TimelineRecordName;

export interface TimelineRecordParentId {
    readonly value: TimelineRecordId;
}

export const checkpointApproval: TimelineRecordType = createTimelineRecordType("Checkpoint.Approval");
export const stage: TimelineRecordType = createTimelineRecordType("Stage");

export interface TimelineRecord {
    readonly id: TimelineRecordId;
    readonly parentId: TimelineRecordParentId | null;
    readonly type: TimelineRecordType;
    readonly name: TimelineRecordName;
}

export interface Timeline {
    readonly records: ReadonlyArray<TimelineRecord>;
}

const timelineRecordIdDecoder = Decoder.map(createTimelineRecordId)(Decoder.string);

const timelineRecordTypeDecoder = Decoder.map(createTimelineRecordType)(Decoder.string);

const timelineRecordParentIdDecoder = Decoder.map((value: TimelineRecordId) => ({value,}))(Decoder.map(createTimelineRecordId)(Decoder.string));

const timelineRecordNameDecoder = Decoder.map(createTimelineRecordName)(Decoder.string);

const timelineRecordDecoder = Decoder.struct({
    id: timelineRecordIdDecoder,
    parentId: Decoder.nullable(timelineRecordParentIdDecoder),
    type: timelineRecordTypeDecoder,
    name: timelineRecordNameDecoder,
});

const timelineDecoder = Decoder.struct({
    records: Decoder.array(timelineRecordDecoder),
});

export const fetchTimeline: (organizationName: OrganizationName, projectName: ProjectName, buildId: BuildId, accessToken: AccessToken) => Promise<Timeline> =
    (organizationName, projectName, buildId, accessToken) =>
        fetch(`https://dev.azure.com/${organizationName}/${projectName}/_apis/build/builds/${buildId}/Timeline?api-version=6.0`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then(rejectNonOk())
            .then(bodyFromJson())
            .then(decode(timelineDecoder));
