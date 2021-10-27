import { AMQPConfigConnection } from 'src/configuration/AMQPConfigConnection';
import { AMQPConnection } from '../AMQPConnection';
import { Subject, Subscription, Observable } from 'rxjs';
import { AMQPConnectionStatus } from '../AMQPConnectionStatus';
import { AMQPMessage } from './AMQPMessage';
import { AMQPLogger } from '../logging/AMQPLogger';
import * as chalk from 'chalk';
import { AMQPLogEmoji } from '../logging/AMQPLogEmoji';

export class AMQPQueue {

    private queue$: Subject<AMQPMessage> = new Subject();
    private name: string;
    private config: AMQPConfigConnection;
    private connection: AMQPConnection;
    private subscription: Subscription;

    /**
     * Length of the pending message queue.
     *
     * @type {number}
     */
    public length: number = 0;

    /**
     * Queue instantiator.
     *
     * @param {AMQPConnection} connection
     */
    public constructor(connection: AMQPConnection) {

        this.connection = connection;

        //
        // Listen for connection status changes.
        //
        this.connection.status$.subscribe(status => {

            //
            // If we're now connected, drain the queue, otherwise stop listening.
            //
            if (status === AMQPConnectionStatus.CONNECTED) {

                AMQPLogger.debug(`${ chalk.greenBright('Connection established') }, queue is ready for drain operations for the connection ${ chalk.yellowBright(this.connection.config.name) }!`,
                                 AMQPLogEmoji.SUCCESS,
                                 'QUEUE MANAGER');

                this.subscription = this.queue$.subscribe(messages => this.drain(messages));

            } else if (this.subscription) {

                AMQPLogger.debug(`${ chalk.greenBright('Connection established') }, queue has stopped draining operations for the connection ${ chalk.yellowBright(this.connection.config.name) }!`,
                                 AMQPLogEmoji.DISCONNECT,
                                 'QUEUE MANAGER');

                this.subscription.unsubscribe();

            }

        });

    }

    /**
     * Subscribes to the queue$ {Subject} and publishes the pending message.
     *
     * @param {AMQPMessage} message
     */
    public drain(message: AMQPMessage): void {

        this.connection.reference$.subscribe(reference => {

            const result = reference.channel.publish(message.exchange.toString(), message.routingKey.toString(), message.message);

            this.length--;

            if (message.published$) {

                message.published$.next(result);

            }

        });

    }

    /**
     * Publish a new message the queue.
     *
     * @param {AMQPMessage} message
     */
    public publish(message: AMQPMessage): void {

        AMQPLogger.debug(`${ chalk.greenBright('Publishing message') } to ${ chalk.yellowBright(message.exchange) }(#${ chalk.blueBright(message.routingKey) }) for the connection "${ chalk.yellowBright(this.connection.config.name) }"`,
                         AMQPLogEmoji.INBOX,
                         'QUEUE MANAGER');

        this.queue$.next(message);

        this.length++;

    }

    /**
     * Helper method to wrap .publish() via arguments.
     *
     * @param {string} exchange Exchange to publish message through.
     * @param {string} routingKey Routing key to publish message under.
     * @param {Object} message Object that gets serialized into a json string.
     * @param {Subject<boolean>} published$ Emitted when the messages has been published from the queue.
     *
     * @return {Subject<boolean>} Observable that is .next'ed upon completion with the boolean response from amqplib.
     */
    public publishJSON(exchange: string | number, routingKey: string | number, message: Object, published$: Subject<boolean> = new Subject()): Observable<boolean> {

        this.publish({

                         exchange,
                         routingKey,
                         message: Buffer.from(JSON.stringify(message)),
                         published$

                     });

        return published$;

    }

}
