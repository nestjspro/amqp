import { AMQPConfigConnection } from './AMQPConfigConnection';
import { AMQPLogLevel } from './AMQPLogLevel';

export interface AMQPConfig {

    logLevel?: AMQPLogLevel;
    connections: Array<AMQPConfigConnection>;

}
