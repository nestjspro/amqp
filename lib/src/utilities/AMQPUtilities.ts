export class AMQPUtilities {

    /**
     * Serialize (convert to a buffer) to prepare for transmission.
     *
     * @param result string, object (json), etc.
     *
     * @return {Buffer}
     */
    public static serialize(result: any): Buffer {

        let payload: Buffer;

        if (!Buffer.isBuffer(result)) {

            try {

                payload = Buffer.from(JSON.stringify(result));

            } catch (e) {

                payload = Buffer.from(result);

            }

        } else {

            payload = result;

        }

        return payload;

    }

}
