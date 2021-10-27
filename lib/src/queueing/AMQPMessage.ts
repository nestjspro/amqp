import { Subject } from 'rxjs';

export class AMQPMessage {

    public exchange: string | number;
    public routingKey: string | number;
    public message: Buffer;

    public published$?: Subject<boolean>;

}
