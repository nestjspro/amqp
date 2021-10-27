import { AMQPQueueOptions } from '../AMQPQueueOptions';

export interface AMQPConfigQueue {

    createBindings?: boolean;
    name: string;
    routingKey?: string;
    options?: AMQPQueueOptions;

}
