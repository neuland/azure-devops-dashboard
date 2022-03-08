import * as Decoder from "io-ts/lib/Decoder";
import {AccessToken} from "azure/devops/react/authentication/AccessToken";
import {bodyFromJson, rejectNonOk} from "azure/devops/api/_util/Response";
import {decode} from "decode";

const profileIdTag = Symbol("ProfileId");
export type ProfileId = string & { readonly _tag: typeof profileIdTag; };
const createProfileId: (value: string) => ProfileId = (value) => value as ProfileId;

export const meProfileId: ProfileId = createProfileId("me");

export interface Profile {
    id: ProfileId;
}

const profileIdDecoder = Decoder.map(createProfileId)(Decoder.string);

const profileDecoder = Decoder.struct({
    id: profileIdDecoder,
});

export const fetchProfile: (id: ProfileId, accessToken: AccessToken) => Promise<Profile> =
    (id, accessToken) =>
        fetch(`https://app.vssps.visualstudio.com/_apis/profile/profiles/${id}?api-version=6.0`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
            .then(rejectNonOk())
            .then(bodyFromJson())
            .then(decode(profileDecoder));
