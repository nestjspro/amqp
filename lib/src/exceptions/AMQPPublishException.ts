export class AMQPPublishException extends Error {
    public constructor(message?: string) {
        super(message);

        this.name = 'AMQPPublishException';
    }
}
