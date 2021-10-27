import { Subject } from 'rxjs';
import { Options } from 'amqplib';
import Publish = Options.Publish;

export interface AMQPQueueMessage {

    exchange: string | number;
    routingKey: string | number;
    message: Buffer;
    options?: Publish;

    published$?: Subject<boolean>;

}
