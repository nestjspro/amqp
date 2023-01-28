import { Options } from 'amqplib/properties';
import { AMQPLogLevel } from '../logging/AMQPLogLevel';
import { AMQPConfigExchange } from './AMQPConfigExchange';
import { AMQPConfigQueue } from './AMQPConfigQueue';

export interface AMQPConfigConnection {

    name?: string;
    url: string | Options.Connect;
    exchange?: AMQPConfigExchange;
    queues?: Array<AMQPConfigQueue>;
    logLevel?: AMQPLogLevel;
    prefetch?: number;
    timeout?: number;
    exitOnError?: boolean;
    autoConnect?: boolean;
    autoReconnect?: boolean;

}
