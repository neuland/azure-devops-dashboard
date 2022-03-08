import {AccessToken} from "./azure/devops/react/authentication/AccessToken";
import {fetchProfile, meProfileId} from "./azure/devops/api/profile/profiles/Profile";
import {fetchAccounts, MemberId} from "./azure/devops/api/account/accounts/Account";
import {deriveOrganizations, OrganizationName} from "./azure/devops/api/_custom/organization/Organization";
import {fetchProjects, ProjectName} from "./azure/devops/api/core/projects/Project";
import {BuildId, fetchBuilds, inProgress} from "./azure/devops/api/build/builds/Build";
import {checkpointApproval, fetchTimeline} from "./azure/devops/api/build/timeline/Timeline";
import {deriveStage, Stage} from "./azure/devops/api/_custom/build/stages/Stage";

const promiseFlatMapAll: <A>(promises: ReadonlyArray<Promise<ReadonlyArray<A>>>) => Promise<ReadonlyArray<A>> =
    async (promises) => (await Promise.all(promises)).flatMap(a => a);

export interface Approval {
    organizationName: OrganizationName;
    projectName: ProjectName;
    buildId: BuildId;
    maybeStage: Stage | null;
}

export interface Data {
    readonly pendingApprovals: ReadonlyArray<Approval>;
}

// See https://stackoverflow.com/a/63414709 on how to retrieve approvals

export const fetchData: (accessToken: AccessToken) => Promise<Data> =
    async (accessToken) => {
        const profile = await fetchProfile(meProfileId, accessToken);
        const memberId: MemberId = {value: profile.id,};
        const accounts = await fetchAccounts(memberId, accessToken);
        const {organizations} = deriveOrganizations(accounts);
        const pendingApprovals = await promiseFlatMapAll(organizations.map(async (organization) => {
            const projects = await fetchProjects(organization.name, accessToken);
            return await promiseFlatMapAll(projects.map(async (project) => {
                const builds = await fetchBuilds(organization.name, project.name, accessToken);
                const inProgressBuilds = builds.filter(build => build.status === inProgress);
                return await promiseFlatMapAll(inProgressBuilds.map(async (inProgressBuild) => {
                    const timeline = await fetchTimeline(organization.name, project.name, inProgressBuild.id, accessToken);
                    const approvalRecords = timeline.records.filter(record => record.type === checkpointApproval);
                    return approvalRecords.map((approvalRecord) => {
                        const maybeStage = deriveStage(timeline.records, approvalRecord);
                        const approval: Approval = {
                            organizationName: organization.name,
                            projectName: project.name,
                            buildId: inProgressBuild.id,
                            maybeStage,
                        }
                        return approval;
                    });
                }));
            }));
        }));

        return {
            pendingApprovals: pendingApprovals,
        };
    };
