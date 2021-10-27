import { ConsumeMessage } from 'amqplib';

export class AMQPMessage {

    public message: ConsumeMessage;
    public ack: Function;

}
