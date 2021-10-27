import { AMQPConnection } from '../AMQPConnection';
import { Subject, Subscription, Observable, ReplaySubject } from 'rxjs';
import { AMQPConnectionStatus } from '../AMQPConnectionStatus';
import { AMQPQueueMessage } from './AMQPQueueMessage';
import { AMQPLogger } from '../logging/AMQPLogger';
import * as chalk from 'chalk';
import { AMQPLogEmoji } from '../logging/AMQPLogEmoji';

export class AMQPQueue {

    private queue$: ReplaySubject<AMQPQueueMessage> = new ReplaySubject();
    private connection: AMQPConnection;
    private subscription: Subscription;
    private readonly logger: AMQPLogger;

    /**
     * Length of the pending message queue.
     *
     * @type {number}
     */
    public length: number = 0;

    /**
     * Maximum number of messages to allow in queue at a time.
     *
     * @type {number}
     */
    public max: number;

    public subscriptions: Subscription = new Subscription();

    /**
     * Queue instantiator.
     *
     * @param {AMQPConnection} connection Connection reference.
     * @param {number} max Maximum number of messages to allow in queue at a time.
     */
    public constructor(connection: AMQPConnection, max?: number) {

        this.logger = connection.logger;
        this.connection = connection;
        this.max = max;

        //
        // Listen for connection status changes.
        //
        this.connection.status$.subscribe(status => {

            //
            // If we're now connected, drain the queue, otherwise stop listening.
            //
            if (status === AMQPConnectionStatus.CONNECTED) {

                this.logger.debug(`${ chalk.greenBright('Connection established') }, queue is ready for drain operations for the connection ${ chalk.yellowBright(this.connection.config.name) }!`, AMQPLogEmoji.SUCCESS, 'QUEUE MANAGER');

                //
                // Start draining the queue and listening for
                // additional messages.
                //
                this.subscriptions.add(this.queue$.subscribe(messages => this.drain(messages)));

            } else {

                this.subscriptions.unsubscribe();

                this.logger.debug(`${ chalk.greenBright('Connection established') }, queue has stopped draining operations for the connection ${ chalk.yellowBright(this.connection.config.name) }!`, AMQPLogEmoji.DISCONNECT, 'QUEUE MANAGER');

            }

        });

    }

    /**
     * Subscribes to the queue$ {Subject} and publishes the pending message.
     *
     * @param {AMQPQueueMessage} message
     */
    public drain(message: AMQPQueueMessage): void {

        this.subscriptions.add(this.connection.reference$.subscribe(reference => {

            this.logger.debug(`${ chalk.redBright('Draining message') } to ${ chalk.yellowBright(message.exchange) }(#${ chalk.blueBright(message.routingKey) }) for the connection "${ chalk.yellowBright(this.connection.config.name) }"`, AMQPLogEmoji.DOWN, 'QUEUE MANAGER');

            if (this.connection.status === AMQPConnectionStatus.CONNECTED) {

                // const result = reference.channel.publish(message.exchange.toString(), message.routingKey.toString(), message.message, message.options);

                this.length--;

                //
                // If the caller passed in an observable, call it to
                // notify that the message has been published.
                //
                // This is beneficial in the event that there is a
                // long backlog of messages due to connectivity issue(s).
                //
                if (message.published$) {

                    // message.published$.next(result);

                }

            }

        }));

    }

    /**
     * Publish a new message the queue.
     *
     * @param {AMQPQueueMessage} message
     */
    public publish(message: AMQPQueueMessage): void {

        this.logger.debug(`${ chalk.greenBright('Publishing message') } to ${ chalk.yellowBright(message.exchange) }(#${ chalk.blueBright(message.routingKey) }) for the connection "${ chalk.yellowBright(this.connection.config.name) }" (${ this.connection.status === AMQPConnectionStatus.CONNECTED ? chalk.green(this.connection.status) : chalk.red(this.connection.status) })`, AMQPLogEmoji.INBOX, 'QUEUE MANAGER');

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
