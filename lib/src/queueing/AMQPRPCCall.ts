import { Options } from 'amqplib';
import Publish = Options.Publish;

export interface AMQPRPCCall {

    correlationId?: string;
    queue: string;
    message: any;
    options?: Publish;
    timeout?: number;

}
