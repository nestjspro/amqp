import { AMQPConfigConnection } from './AMQPConfigConnection';
import { AMQPLogLevel } from '../logging/AMQPLogLevel';

export interface AMQPConfig {

    logLevel?: AMQPLogLevel;
    connections: Array<AMQPConfigConnection>;

}
