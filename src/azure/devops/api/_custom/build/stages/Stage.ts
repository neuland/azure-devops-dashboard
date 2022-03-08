import {
    stage as stageTimelineRecordType,
    TimelineRecord,
    TimelineRecordId,
    TimelineRecordName
} from "azure/devops/api/build/timeline/Timeline";

const stage = Symbol("Stage");
export type Stage = string & { readonly _tag: typeof stage; };
const createStage: (value: TimelineRecordName) => Stage = (value) => value as string as Stage;

export const deriveStage: (records: ReadonlyArray<TimelineRecord>, start: TimelineRecord) => Stage | null =
    (records, start) => {
        let seenIds: ReadonlyArray<TimelineRecordId> = [];
        let current = start;
        while (current.parentId !== null) {
            if (seenIds.includes(current.id)) {
                console.debug(`encountered record id ${current.id} more than once`);
                return null;
            }

            seenIds = [...seenIds, current.id];

            const idToCompareTo = current.parentId?.value;
            const searchResult = records.filter(searchRecord => {
                return searchRecord.id === idToCompareTo;
            });

            if (searchResult.length > 1) {
                console.debug(`more than one record with id ${current.id}`);
                return null;
            }

            if (searchResult.length === 0) {
                return null;
            }

            const matchingRecord = searchResult[0];
            if (matchingRecord.type === stageTimelineRecordType) {
                return createStage(matchingRecord.name);
            }

            current = matchingRecord;
        }

        return null;
    };
