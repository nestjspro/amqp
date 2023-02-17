import { Connection, Channel } from 'amqplib';

export class AMQPReference {
    public connection: Connection;
    public channel: Channel;
}
