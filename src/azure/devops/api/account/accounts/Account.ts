import * as Decoder from "io-ts/lib/Decoder";
import * as Function from "fp-ts/lib/function";
import {ProfileId} from "azure/devops/api/profile/profiles/Profile";
import {AccessToken} from "azure/devops/react/authentication/AccessToken";
import {bodyFromJson, rejectNonOk} from "azure/devops/api/_util/Response";
import {decode} from "decode";

const accountNameTag = Symbol("AccountName");
export type AccountName = string & { readonly _tag: typeof accountNameTag; };
const createAccountName: (value: string) => AccountName = (value) => value as AccountName;

const accountTypeValues = [
    "organization",
    "personal",
] as const;
const accountTypeTag = Symbol("AccountType");
export type AccountType = typeof accountTypeValues[number] & { readonly _tag: typeof accountTypeTag; };
const createAccountType: (value: typeof accountTypeValues[number]) => AccountType = (value) => value as AccountType;

export const organization = createAccountType("organization");
export const personal = createAccountType("personal");

export interface Account {
    name: AccountName;
    type: AccountType;
}

export interface MemberId {
    value: ProfileId;
}

const accountNameDecoder = Decoder.map(createAccountName)(Decoder.string);

const accountTypeDecoder: Decoder.Decoder<unknown, AccountType> = {
    decode: (input) => {
        if (input === "organization") {
            return Decoder.success(organization);
        }
        if (input === "personal") {
            return Decoder.success(personal);
        }

        return Decoder.failure(input, "either \"organization\" or \"personal\"");
    },
};

const accountDecoder = Function.pipe(
    Decoder.struct({
        accountName: accountNameDecoder,
    }),
    Decoder.intersect(
        Decoder.partial({
            accountType: accountTypeDecoder,
        })
    )
);

const accountsResponseDecoder = Decoder.struct({
    value: Decoder.array(accountDecoder),
});

export const fetchAccounts: (memberId: MemberId, accessToken: AccessToken) => Promise<Array<Account>> =
    (memberId, accessToken) =>
        fetch(`https://app.vssps.visualstudio.com/_apis/accounts?memberId=${memberId.value}&api-version=6.0`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then(rejectNonOk())
            .then(bodyFromJson())
            .then(decode(accountsResponseDecoder))
            .then(_ => _.value.map((original) => ({
                name: original.accountName,
                type: original.accountType ?? organization,
            })));
