import { ConsumeMessage } from 'amqplib';

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
     * Acknowledgement method.
     * Should be called upon receipt.
     *
     * @type {Function}
     */
    public ack?: Function;

    /**
     * Original message envelope & late acknowledgement method.
     *
     * @param {ConsumeMessage} message
     * @param {Function} ack
     */
    public constructor(message: ConsumeMessage, ack?: Function) {

        this.message = message;
        this.ack = ack;

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
