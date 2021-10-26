export class AMQPConnectionNotFoundException extends Error {

    public constructor(message?: string) {

        super(message);

        this.name = 'AMQPConnectionNotFoundException';

    }

}
