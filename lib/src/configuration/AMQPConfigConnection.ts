import { AMQPConfigQueue } from './AMQPConfigQueue';
import { AMQPConfigExchange } from './AMQPConfigExchange';
import { AMQPLogLevel } from '../logging/AMQPLogLevel';
import { Options } from 'amqplib/properties';

export interface AMQPConfigConnection {

    name: string;
    url: string | Options.Connect;
    exchange: AMQPConfigExchange;
    queues?: Array<AMQPConfigQueue>;
    logLevel?: AMQPLogLevel;
    prefetch?: number;
    timeout?: number;

}
