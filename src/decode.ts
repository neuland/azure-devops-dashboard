import * as Decoder from "io-ts/Decoder";
import * as Function from "fp-ts/function";
import * as Either from "fp-ts/Either";

export class ThrowableDecodeError extends Error {
    constructor(error: Decoder.DecodeError) {
        super(Decoder.draw(error));

        Object.setPrototypeOf(this, ThrowableDecodeError.prototype);
    }
}

export const decode: <A>(decoder: Decoder.Decoder<unknown, A>) => (input: unknown) => Promise<A> =
    (decoder) =>
        Function.flow(
            decoder.decode,
            Either.fold(
                (e) => Promise.reject(new ThrowableDecodeError(e)),
                (a) => Promise.resolve(a)
            )
        );
