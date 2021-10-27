import { AMQPConfigQueue } from './AMQPConfigQueue';
import { AMQPConfigExchange } from './AMQPConfigExchange';
import { AMQPLogLevel } from '../logging/AMQPLogLevel';

export interface AMQPConfigConnection {

    name: string;
    uri: string;
    exchange: AMQPConfigExchange;
    queues?: Array<AMQPConfigQueue>;
    logLevel?: AMQPLogLevel;

}
