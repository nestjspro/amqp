export class AMQPMessageHandlers {
    public ack: (allUpTo?: boolean) => void;
    public ackAll: () => void;
    public nack: (allUpTo?: boolean, requeue?: boolean) => void;
    public nackAll: () => void;

    public constructor(handlers: AMQPMessageHandlers) {
        this.ack = handlers.ack;
        this.ackAll = handlers.ackAll;
        this.nack = handlers.nack;
        this.nackAll = handlers.nackAll;
    }
}
