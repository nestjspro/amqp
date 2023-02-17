import { AMQPLogLevel } from '../logging/AMQPLogLevel';
import { AMQPConfigConnection } from './AMQPConfigConnection';

export class AMQPConfig {
    public logLevel?: AMQPLogLevel;
    public connections: Array<AMQPConfigConnection>;
    public exitOnError?: boolean;
    public autoConnect?: boolean;
    public autoReconnect?: boolean;

    public constructor(config: AMQPConfig) {
        Object.assign(this, config);
    }
}
