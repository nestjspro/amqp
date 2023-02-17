import { ConsumeMessage } from 'amqplib';
import { AMQPMessageHandlers } from './AMQPMessageHandlers';

/**
 * Message envelope.
 */
export class AMQPMessage<T> {
    /**
     * Original message envelope from the AMQP service.
     *
     * @type {ConsumeMessage}
     */
    public message: ConsumeMessage;

    /**
     * Various ways to acknowledge a message.
     * Should be called upon receipt.
     *
     * @type {AMQPMessageHandlers}
     */
    public handlers?: AMQPMessageHandlers;

    /**
     * Original message envelope & late acknowledgement method.
     *
     * @param {ConsumeMessage} message
     * @param {AMQPMessageHandlers} handlers various ways to acknowledge a message.
     */
    public constructor(message: ConsumeMessage, handlers?: AMQPMessageHandlers) {
        this.message = message;
        this.handlers = handlers;
    }

    /**
     * Deserializes the message.content buffer (string) in to an
     * objct of type {T}.
     *
     * @return {T} message.content as {T}.
     */
    public fromJSON(): T {
        return JSON.parse(this.message.content.toString());
    }
}
