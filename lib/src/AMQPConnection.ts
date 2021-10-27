import * as amqp from 'amqplib';
import { Replies } from 'amqplib';
import { AMQPConfigConnection } from './configuration/AMQPConfigConnection';
import { ReplaySubject, BehaviorSubject, Subject } from 'rxjs';
import { AMQPReference } from './AMQPReference';
import { AMQPConnectionStatus } from './AMQPConnectionStatus';
import { AMQPLogger } from './logging/AMQPLogger';
import * as chalk from 'chalk';
import { AMQPQueue } from './queueing/AMQPQueue';
import { AMQPLogEmoji } from './logging/AMQPLogEmoji';
import { AMQPMessage } from './queueing/AMQPMessage';
import { AMQPSubscriber } from './queueing/AMQPSubscriber';
import { AMQPRPCCall } from './queueing/AMQPRPCCall';
import { randomUUID } from 'crypto';
import Consume = Replies.Consume;

/**
 * AMQP individual connection class.
 */
export class AMQPConnection {

    /**
     * Connection status.
     *
     * @type {AMQPConnectionStatus}
     */
    public status: AMQPConnectionStatus;

    /**
     * Connection status event change observable.
     *
     * @type {BehaviorSubject<AMQPConnectionStatus>}
     */
    public status$: ReplaySubject<AMQPConnectionStatus> = new ReplaySubject();

    /**
     * Connection configuration settings.
     *
     * @type {AMQPConfigConnection}
     */
    public config: AMQPConfigConnection;

    /**
     * References to the connection and channel for this connection.
     *
     * @type {ReplaySubject<AMQPReference>}
     */
    public reference$: ReplaySubject<AMQPReference> = new ReplaySubject();

    /**
     * Queue for managing message delivery.
     *
     * @type {AMQPQueue}
     */
    public queue: AMQPQueue;

    /**
     * AMQP individual connection class constructor (requires a configuration object).
     *
     * @param {AMQPConfigConnection} config
     */
    public constructor(config: AMQPConfigConnection) {

        AMQPLogger.trace(`Instantiating AMQP connection "${ chalk.yellowBright(config.name) }"..`, AMQPLogEmoji.NEW, 'CONNECTION MANAGER');

        this.status = AMQPConnectionStatus.DISCONNECTED;
        this.queue = new AMQPQueue(this);
        this.config = config;

        //
        // Subscribe to status changes so we can log them.
        //
        this.status$.subscribe(status => {

            AMQPLogger.debug(`Connection status changed to ${ chalk.greenBright(status) } for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'CONNECTION MANAGER');

            if (status === AMQPConnectionStatus.CONNECTED) {

                this.declareResources().subscribe(() => {

                    AMQPLogger.debug(`AMQP connection "${ chalk.yellowBright(this.config.name) }" is ready!`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                });

            }

        });

        this.connect();

    }

    /**
     * Connect to the AMQP server.
     *
     * @returns {ReplaySubject<AMQPReference>}
     */
    public connect(): ReplaySubject<AMQPReference> {

        this.status$.next(AMQPConnectionStatus.CONNECTING);

        try {

            amqp.connect(this.config.url, { timeout: this.config.timeout || 30000 }).then(async connection => {

                const channel = await connection.createChannel();

                await channel.prefetch(!!this.config.prefetch ? this.config.prefetch : 1);

                this.setStatus(AMQPConnectionStatus.CONNECTED);

                this.reference$.next({ connection, channel });

            });

            return this.reference$;

        } catch (e) {

            this.setStatus(AMQPConnectionStatus.DISCONNECTED);

            console.log(e);

        }

    }

    /**
     * Disconnect from the AMQP server.
     * (This does not remove any resources such as queues, exchanges, etc..)
     *
     * @author Matthew Davis <matthew@matthewdavis.io
     */
    public disconnect(): void {

        this.reference$.subscribe(async reference => {

            await reference.channel.close();
            await reference.connection.close();

            this.setStatus(AMQPConnectionStatus.DISCONNECTED);

        });

    }


    public tearDown(): Subject<void> {

        AMQPLogger.debug(`Tearing down AMQP resources for connection "${ chalk.yellowBright(this.config.name) }"..`);

        const subject$: Subject<void> = new Subject();

        this.reference$.subscribe(async reference => {

            for (let i = 0; i < this.config.queues.length; i++) {

                AMQPLogger.debug(`Deleting queue "${ this.config.queues[ i ].name }" on AMQP connection "${ this.config.name }"..`, AMQPLogEmoji.DISCONNECT, 'CONNECTION MANAGER');

                await reference.channel.deleteQueue(this.config.queues[ i ].name);

            }

            AMQPLogger.debug(`Deleting queue "${ this.config.exchange.name }" on AMQP connection "${ this.config.name }"..`, AMQPLogEmoji.DISCONNECT, 'CONNECTION MANAGER');

            await reference.channel.deleteExchange(this.config.exchange.name);

            subject$.next();

        });

        return subject$;

    }

    /**
     * Declare exchange and queue(s) then setup bindings.
     *
     * @author Matthew Davis <matthew@matthewdavis.io>
     *
     * @returns {Subject<void>} Observable emitted when complete.
     */
    public declareResources(): Subject<void> {

        AMQPLogger.debug(`Declaring AMQP resources for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.NEW, 'CONNECTION MANAGER');

        const subject$: Subject<void> = new Subject();

        this.reference$.subscribe(async reference => {

            await reference.channel.assertExchange(this.config.exchange.name, this.config.exchange.type, this.config.exchange.options);

            for (let i = 0; i < this.config.queues.length; i++) {

                if (this.config.queues[ i ].createBindings) {

                    await reference.channel.assertQueue(this.config.queues[ i ].name);
                    AMQPLogger.debug(`Declared the queue "${ chalk.yellowBright(this.config.queues[ i ].name) }" for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                    await reference.channel.bindQueue(this.config.queues[ i ].name, this.config.exchange.name, this.config.queues[ i ].routingKey);
                    AMQPLogger.debug(`Binded the queue "${ chalk.yellowBright(this.config.queues[ i ].name) }" for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                }

            }

            subject$.next();

        });

        return subject$;

    }

    /**
     * Change status to a new value.
     *
     * @param {AMQPConnectionStatus} status
     */
    public setStatus(status: AMQPConnectionStatus): void {

        this.status$.next(status);

        this.status = status;

    }

    /**
     * Subscribe to a queue returning an observable.
     *
     * Message will auto-acknowledge itself when emitted if not disabled.
     *
     * @param {AMQPSubscriber} subscriber Subscripton configuration object.
     *
     * @return {Subject<AMQPMessage>} Observable emitting new messages on arrival.
     */
    public subscribe(subscriber: AMQPSubscriber): Subject<AMQPMessage<any>> {

        const subject$: Subject<AMQPMessage<any>> = new Subject();

        //
        // Acquire connection reference.
        //
        this.reference$.subscribe(reference => {

            //
            // Start consuming (subscribing) new messages.
            //
            reference.channel.consume(subscriber.queue, message => {

                AMQPLogger.debug(`Subscribe emitted deliveryTag #${ chalk.yellowBright(message.fields.deliveryTag) } for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                //
                // Emit the new message.
                //
                subject$.next(new AMQPMessage<any>(message, () => {

                    // Lazy acknowledgement method.
                    reference.channel.ack(message);

                }));

                //
                // Automatically acknowledge message if not otherwise set to true.
                //
                if (!subscriber.noAck) {

                    reference.channel.ack(message);

                }

            });

        });

        return subject$;

    }

    /**
     * Perform an RPC call and return the response.
     *
     * Before performing the request a new queue will be generated
     * and subcribe to temporarily.
     *
     * **NOTE:** This call is susceptible to a timout (defaults to 5 seconds).
     *
     * @param {AMQPRPCCall} call RPC call configuration object.
     * @return {Subject<any>} Observable which emits a reply of type {T}.
     */
    public rpcCall<T>(call: AMQPRPCCall): Subject<AMQPMessage<T>> {

        const subject$: Subject<AMQPMessage<T>> = new Subject();

        //
        // Calculate correlationId (used for mapping the sender
        // and receiver of a message across pub/sub sessions).
        //
        if (!call.options) {

            call.options = { correlationId: randomUUID() };

        } else if (call.options && !call.options.correlationId) {

            call.options.correlationId = randomUUID();

        }

        //
        // Acquire the connection reference safely.
        //
        this.reference$.subscribe(reference => {

            AMQPLogger.debug(`Sending RPC call to correlationId #${ chalk.yellowBright(call.options.correlationId) } for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

            //
            // Kick off the consumer first.
            //
            reference.channel.consume(call.queue, message => {

                console.log(`a: ${ message.content.toString() }`);

                subject$.next(new AMQPMessage<T>(message));

            }, call.options);

            //
            // Publish the RPC message.
            //
            reference.channel.sendToQueue(call.queue, call.message, call.options);

            const timeout = setTimeout(() => {

                console.log('timed out');

            }, call.timeout);

        });

        return subject$;

    }

    public rpcConsume<T>(queue: string, callback: Function, options?: Consume): Subject<T> {

        const subject$: Subject<T> = new Subject();

        this.reference$.subscribe(async reference => {

            AMQPLogger.debug(`RPC consuming queue "${ chalk.yellowBright(queue) }" for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

            await reference.channel.assertQueue(queue, { autoDelete: true });

            reference.channel.consume(queue, message => {

                console.log(message);

                const reply = callback(message);


                console.log(reply);
                reference.channel.sendToQueue(queue, Buffer.from(reply), {

                    correlationId: message.properties.correlationId,
                    replyTo: message.properties.replyTo

                });

            }, options);

        });

        return subject$;

    }

}
