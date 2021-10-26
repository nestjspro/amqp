export interface AMQPQueueOptions {

    exclusive?: boolean | undefined;
    durable?: boolean | undefined;
    autoDelete?: boolean | undefined;
    arguments?: any;
    messageTtl?: number | undefined;
    expires?: number | undefined;
    deadLetterExchange?: string | undefined;
    deadLetterRoutingKey?: string | undefined;
    maxLength?: number | undefined;
    maxPriority?: number | undefined;

}
