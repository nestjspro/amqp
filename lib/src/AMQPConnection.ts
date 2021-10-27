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
     * @author Matthew Davis <matthew@matthewdavis.io
     *
     * @type {AMQPConnectionStatus}
     */
    public status: AMQPConnectionStatus;

    /**
     * Connection status event change observable.
     *
     * @author Matthew Davis <matthew@matthewdavis.io
     *
     * @type {BehaviorSubject<AMQPConnectionStatus>}
     */
    public status$: ReplaySubject<AMQPConnectionStatus> = new ReplaySubject();

    /**
     * Connection configuration settings.
     *
     * @author Matthew Davis <matthew@matthewdavis.io
     *
     * @type {AMQPConfigConnection}
     */
    public config: AMQPConfigConnection;

    /**
     * References to the connection and channel for this connection.
     *
     * @author Matthew Davis <matthew@matthewdavis.io
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
     * @author Matthew Davis <matthew@matthewdavis.io
     *
     * @param {AMQPConfigConnection} config
     */
    public constructor(config: AMQPConfigConnection) {

        AMQPLogger.trace(`Instantiating AMQP connection "${ chalk.yellowBright(config.name) }"..`, AMQPLogEmoji.NEW, 'CONNECTION MANAGER');

        this.status = AMQPConnectionStatus.DISCONNECTED;
        this.queue = new AMQPQueue(this);
        this.config = config;

        this.connect();

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

    }

    /**
     * Connect to the AMQP server.
     *
     * @author Matthew Davis <matthew@matthewdavis.io
     *
     * @returns {ReplaySubject<AMQPReference>}
     */
    public connect(): ReplaySubject<AMQPReference> {

        this.status$.next(AMQPConnectionStatus.CONNECTING);

        try {

            amqp.connect(this.config.uri).then(async connection => {

                const channel = await connection.createChannel();

                await channel.prefetch(!!this.config.prefetch ? this.config.prefetch : 1);

                this.reference$.next({ connection, channel });

                this.setStatus(AMQPConnectionStatus.CONNECTED);

            });

            return this.reference$;

        } catch (e) {

            console.log(e);

            this.setStatus(AMQPConnectionStatus.DISCONNECTED);

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

    public setStatus(status: AMQPConnectionStatus): void {

        this.status$.next(status);

        this.status = status;

    }

    public subscribe(subscriber: AMQPSubscriber): Subject<AMQPMessage> {

        const subject$: Subject<AMQPMessage> = new Subject();

        this.reference$.subscribe(reference => {

            reference.channel.consume(subscriber.queue, (message) => {

                AMQPLogger.debug(`Subscribe emitted deliveryTag #${ chalk.yellowBright(message.fields.deliveryTag) } for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                subject$.next({

                    message,
                    ack: () => {

                        reference.channel.ack(message);

                    }

                });

                if (!subscriber.noAck) {

                    reference.channel.ack(message);

                }

            });

        });

        return subject$;

    }

    public rpcCall<T>(call: AMQPRPCCall): Subject<any> {

        const subject$: Subject<T> = new Subject();

        if (!call.options) {

            call.options = { correlationId: randomUUID() };

        } else if (call.options && !call.options.correlationId) {

            call.options.correlationId = randomUUID();

        }

        this.reference$.subscribe(reference => {

            AMQPLogger.debug(`Sending RPC call to correlationId #${ chalk.yellowBright(call.options.correlationId) } for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

            reference.channel.consume(call.queue, message => {

                console.log(`a: ${ message.content.toString() }`);

            });

            reference.channel.sendToQueue(call.queue, call.message, call.options);

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
