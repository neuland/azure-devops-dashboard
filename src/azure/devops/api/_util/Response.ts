export class ResponseError extends Error {
    constructor(msg: string, response: Response, body: any) {
        super(JSON.stringify({
            msg,
            response,
            body,
        }));

        Object.setPrototypeOf(this, ResponseError.prototype);
    }
}

const createResponseError: (msg: string, response: Response) => Promise<ResponseError> =
    async (msg, response) => {
        let body: any;

        try {
            body = await response.json();
        } catch (_) {
            try {
                body = await response.text();
            } catch (_) {
                body = undefined;
            }
        }

        return new ResponseError(msg, response, body);
    };

export const rejectNonOk: () => (response: Response) => Promise<Response> =
    () => async (response) => {
        if (response.status !== 200) {
            throw await createResponseError(`expected OK status but got ${response.statusText}`, response);
        }

        return response;
    };

export const bodyFromJson: () => (response: Response) => Promise<any> = () => (response) => response.json();
