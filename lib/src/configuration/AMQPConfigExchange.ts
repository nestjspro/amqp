import { Options } from 'amqplib/properties';

export interface AMQPConfigExchange {
    name: string;
    type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string;
    options?: Options.AssertExchange;
}
