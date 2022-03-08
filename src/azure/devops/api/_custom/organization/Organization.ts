import {Account, organization} from "azure/devops/api/account/accounts/Account";

const organizationNameTag = Symbol("OrganizationName");
export type OrganizationName = string & { readonly _tag: typeof organizationNameTag; };
const createOrganizationName: (value: string) => OrganizationName = (value) => value as OrganizationName;

export interface Organization {
    name: OrganizationName;
}

export const deriveOrganizations: (accounts: ReadonlyArray<Account>) => { organizations: ReadonlyArray<Organization> } =
    (accounts) => {
        return {
            organizations: accounts.flatMap<Organization>(account => {
                if (account.type !== organization) {
                    return [];
                }

                return {
                    name: createOrganizationName(account.name),
                };
            }),
        };
    };
