import * as amqp from 'amqplib';
import { Connection, Replies } from 'amqplib';
import * as chalk from 'chalk';
import { randomUUID } from 'crypto';
import { BehaviorSubject, first, Observable, ReplaySubject, Subject, Subscription } from 'rxjs';
import { AMQPReference } from '../AMQPReference';
import { AMQPConfig } from '../configuration/AMQPConfig';
import { AMQPConfigConnection } from '../configuration/AMQPConfigConnection';
import { AMQPLogEmoji } from '../logging/AMQPLogEmoji';
import { AMQPLogger } from '../logging/AMQPLogger';
import { AMQPMessage } from '../queueing/AMQPMessage';
import { AMQPQueue } from '../queueing/AMQPQueue';
import { AMQPRPCCall } from '../queueing/AMQPRPCCall';
import { AMQPSubscriber } from '../queueing/AMQPSubscriber';
import { AMQPRPCResponse } from '../rpc/AMQPRPCResponse';
import { AMQPUtilities } from '../utilities/AMQPUtilities';
import { AMQPConnectionStatus } from './AMQPConnectionStatus';
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
    public reference: AMQPReference;

    /**
     * Emits only after resources have been declared on rabbitmq.
     *
     * @type {ReplaySubject<void>}
     */
    public declared$: ReplaySubject<void> = new ReplaySubject();

    /**
     * Queue for managing message delivery.
     *
     * @type {AMQPQueue}
     */
    public queue: AMQPQueue;

    /**
     * Maintain a list of active observable subscriptions so
     * they can be cancelled later in the event of a state change.
     *
     * @type {Subscription}
     * @private
     */
    private subscriptions: Array<Subscription> = [];

    /**
     * AMQP individual connection class constructor (requires a configuration object).
     *
     * @param {AMQPConfigConnection} config
     * @param {AMQPLogger} logger
     * @param globalConfig
     */
    public constructor(config: AMQPConfigConnection, public readonly logger: AMQPLogger, private readonly globalConfig: AMQPConfig) {

        this.logger.trace(`Instantiating AMQP connection "${ chalk.yellowBright(config.name) }"..`, AMQPLogEmoji.NEW, 'CONNECTION MANAGER');

        this.status = AMQPConnectionStatus.DISCONNECTED;
        this.queue = new AMQPQueue(this);
        this.config = config;

        if(!this.config.name) {
            this.config.name = randomUUID();
        }

        if (globalConfig.autoConnect || this.config.autoConnect) {

            this.connect();

        }

    }

    /**
     * Connect to the AMQP server.
     *
     * @returns {ReplaySubject<AMQPReference>}
     */
    public connect(): ReplaySubject<AMQPReference> {

        this.status$.next(AMQPConnectionStatus.CONNECTING);

        //
        // Subscribe to status changes so we can log them.
        //
        this.addSubscription(this.status$.subscribe(status => {

            this.logger.debug(`Connection status changed to ${ chalk.greenBright(status) } for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'STATUS');

            if (status !== AMQPConnectionStatus.CONNECTED) {

                this.cancelActiveSubscriptions();

            }

        }));

        try {

            amqp.connect(this.config.url, { timeout: this.config.timeout || 5000 }).then(async connection => {

                this.addEventListeners(connection);

                const channel = await connection.createChannel();
                await channel.prefetch(!!this.config.prefetch ? this.config.prefetch : 1);

                this.reference = { connection, channel };
                this.reference$.next({ connection, channel });

                this.setStatus(AMQPConnectionStatus.CONNECTED);

                this.addSubscription(this.declareResources().subscribe(() => {

                    this.logger.info(`AMQP connection "${ chalk.yellowBright(this.config.name) }" is ready!`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                }));

            });

            return this.reference$;

        } catch (e) {

            this.setStatus(AMQPConnectionStatus.DISCONNECTED);

            console.log(e);

        }

    }

    /* istanbul ignore next */
    public addEventListeners(connection: Connection): void {

        connection.on('close', () => {

            this.disconnect();

            this.logger.debug(`Server said: "${ chalk.greenBright('CLOSED') }" for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'SERVER');

        });

        connection.on('error', error => {

            this.disconnect();

            this.logger.debug(`Server said: "${ chalk.greenBright('ERROR') }" for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'SERVER');

        });

        connection.on('blocked', reason => {

            this.disconnect();

            this.logger.debug(`Server said: "${ chalk.greenBright('BLOCKED') }" for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'SERVER');

        });

        connection.on('unblocked', () => {

            this.logger.debug(`Server said: "${ chalk.greenBright('UNBLOCKED') }" for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'SERVER');

        });

        connection.on('drain', () => {

            this.logger.debug(`Server said: "${ chalk.greenBright('DRAIN') }" for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'SERVER');

        });

        connection.on('return', message => {

            this.logger.debug(`Server said: "${ chalk.greenBright('MESSAGE') }" for connection "${ chalk.yellowBright(this.config.name) }".`, AMQPLogEmoji.SETTINGS, 'SERVER');

        });

    }

    /**
     * Disconnect from the AMQP server.
     * (This does not remove any resources such as queues, exchanges, etc..)
     *
     * @author Matthew Davis <matthew@matthewdavis.io
     */
    public async disconnect(): Promise<void> {

        this.cancelActiveSubscriptions();

        this.setStatus(AMQPConnectionStatus.DISCONNECTED);

        if (this.reference) {

            if (this.reference.channel) {

                try {

                    await this.reference.channel.close();

                } catch (e) {


                }

                if (this.reference && this.reference.connection) {

                    await this.reference.connection.close();

                }

                this.reference = null;


            }


        }

        if (this.config.exitOnError) {

            this.logger.error(`Exiting due to exitOnError being enabled and connection is disconnected for connection "${ chalk.yellowBright(this.config.name) }".`, 'SERVER');
            process.exit(1);

        } else if (this.config.autoReconnect) {

            this.logger.error(`Reconnecting due to autoReconnect being enabled and connection is disconnected for connection "${ chalk.yellowBright(this.config.name) }".`, 'SERVER');

            // await this.connect();

        }

    }

    /**
     * Reconnect this connection by first disconnecting.
     *
     * @return {Observable<void>}
     */
    public reconnect(): Observable<void> {

        const subject$: Subject<void> = new Subject();

        this.disconnect().then(() => {

            this.connect();

            const subscription = this.status$.subscribe(status => {

                if (status === AMQPConnectionStatus.CONNECTED) {

                    subscription.unsubscribe();

                    subject$.next();

                }

            });

        });

        return subject$;

    }

    public tearDown(): Subject<void> {

        this.logger.debug(`Tearing down AMQP resources for connection "${ chalk.yellowBright(this.config.name) }"..`);

        const subject$: Subject<void> = new Subject();

        this.reference$.pipe(first()).subscribe(async reference => {

            for (let i = 0; i < this.config.queues.length; i++) {

                this.logger.debug(`Deleting queue "${ this.config.queues[i].name }" on AMQP connection "${ this.config.name }"..`, AMQPLogEmoji.DISCONNECT, 'CONNECTION MANAGER');

                try {

                    await reference.channel.deleteQueue(this.config.queues[i].name);

                } catch (e) {


                }

            }

            this.logger.debug(`Deleting queue "${ this.config.exchange.name }" on AMQP connection "${ this.config.name }"..`, AMQPLogEmoji.DISCONNECT, 'CONNECTION MANAGER');

            try {

                await reference.channel.deleteExchange(this.config.exchange.name);

            } catch (e) {

            }

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

        this.logger.debug(`Declaring AMQP resources for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.NEW, 'CONNECTION MANAGER');

        const subject$: Subject<void> = new Subject();

        this.addSubscription(this.reference$.pipe(first()).subscribe(async reference => {

            if (this.status === AMQPConnectionStatus.CONNECTED) {

                try {

                    await reference.channel.assertExchange(this.config.exchange.name, this.config.exchange.type, this.config.exchange.options);

                    for (let i = 0; i < this.config.queues.length; i++) {

                        if (this.config.queues[i].createBindings) {

                            await reference.channel.assertQueue(this.config.queues[i].name, this.config.queues[i].options);
                            this.logger.debug(`Declared the queue "${ chalk.yellowBright(this.config.queues[i].name) }" for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                            await reference.channel.bindQueue(this.config.queues[i].name, this.config.exchange.name, this.config.queues[i].routingKey);
                            this.logger.debug(`Binded the queue "${ chalk.yellowBright(this.config.queues[i].name) }" for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                        }

                    }

                    this.declared$.next();

                    subject$.next();

                } catch (e) {


                }

            }

        }));

        return subject$;

    }

    /**
     * Change status to a new value.
     *
     * @param {AMQPConnectionStatus} status
     */
    public setStatus(status: AMQPConnectionStatus): void {

        this.status = status;

        this.status$.next(status);

    }

    /**
     * Subscribe to a queue returning an observable.
     * Message will auto-acknowledge itself when emitted if not disabled.
     *
     * @param {AMQPSubscriber} subscriber Subscripton configuration object.
     *
     * @return {Subject<AMQPMessage>} Observable emitting new messages on arrival.
     *
     * @author Matthew Davis <matthew@matthewdavis.io>
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

                this.logger.debug(`Subscribe emitted deliveryTag #${ chalk.yellowBright(message.fields.deliveryTag) } for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                //
                // Emit the new message.
                //
                subject$.next(new AMQPMessage<any>(message, () => {

                    reference.channel.ack(message);

                }));

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
     *
     * @return {Subject<any>} Observable which emits a reply of type {T}.
     *
     * @author Matthew Davis <matthew@matthewdavis.io>
     */
    public rpcCall<T>(call: AMQPRPCCall): Subject<AMQPMessage<AMQPRPCResponse<T>>> {

        const subject$: Subject<AMQPMessage<AMQPRPCResponse<T>>> = new Subject();

        //
        // Acquire the connection reference safely.
        //
        this.reference$.subscribe(async reference => {

            //
            // Create a new channel.
            //
            const channel = await reference.connection.createChannel();

            //
            // Create a new queue.
            //
            const queue = await channel.assertQueue('', {

                durable: false,
                autoDelete: true

            });

            //
            // Calculate correlationId (used for mapping the sender
            // and receiver of a message across pub/sub sessions).
            //
            if (!call.options) {

                call.options = {

                    correlationId: randomUUID(),
                    replyTo: queue.queue

                };

            }

            this.logger.debug(`Sending RPC call to correlationId #${ chalk.yellowBright(call.options.correlationId) } for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

            //
            // Kick off the consumer first.
            //
            await channel.consume(queue.queue, async message => {

                channel.ack(message);

                await channel.close();

                this.logger.trace(JSON.stringify(message), AMQPLogEmoji.SUCCESS, 'RPC->CALL');

                subject$.next(new AMQPMessage<AMQPRPCResponse<T>>(message));

            }, call.options);

            //
            // Publish the RPC message.
            //
            channel.sendToQueue(call.queue, AMQPUtilities.serialize(call.message), call.options);

        });

        return subject$;

    }

    /**
     * Subscribe to a queue and use the replyTo queue to affect an RPC call.
     *
     * @param {string} queue Name of the queue to bind the RPC call to.
     * @param {Subject<Function>} callback Emits an observable as a result.
     * @param {Replies.Consume} options Consume options such as consumerTag.
     *
     * @return {Subject<void>} observable emits when setup is complete and subscribe is ready.
     *
     * @author Matthew Davis <matthew@matthewdavis.io>
     */
    public rpcConsume<T>(queue: string, callback: Function, options?: Consume): Subject<void> {

        //
        // Observable for emitting when the caller is ready to .subscribe(..)
        // for new messages once setup has complete. This is returned straight
        // away (see the end of this method).
        //
        const subject$: Subject<void> = new Subject();

        //
        // Acquire the connection reference.
        //
        this.declared$.subscribe(() => {

            this.reference$.subscribe(async reference => {

                this.logger.debug(`RPC consuming queue "${ chalk.yellowBright(queue) }" for connection "${ chalk.yellowBright(this.config.name) }"..`, AMQPLogEmoji.SUCCESS, 'CONNECTION MANAGER');

                //
                // Create the (temporary) queue to get the reply from.
                //
                const q = await reference.channel.assertQueue(queue, { autoDelete: true });

                //
                // Subscribe to the temporary queue.
                //
                await reference.channel.consume(queue, message => {

                    //
                    // Execute the callback method that returns the RPC
                    // response as an observable.
                    //
                    callback(new AMQPMessage(message)).subscribe(result => {

                        //
                        // Acknowledge the message so it gets removed now what
                        // our callback has returned without throwing an exception.
                        //
                        reference.channel.ack(message);

                        //
                        // Send the reply back to the RPC consumer/caller.
                        //
                        reference.channel.sendToQueue(message.properties.replyTo, AMQPUtilities.serialize(result), {

                            correlationId: message.properties.correlationId,
                            replyTo: q.queue

                        });

                    });

                }, options);

                //
                // Fire off that we're ready to handle new messages.
                //
                subject$.next();

            });

        });

        return subject$;

    }

    public addSubscription(subscription: Subscription): void {

        this.subscriptions.push(subscription);

    }

    public cancelActiveSubscriptions(): void {

        this.subscriptions.forEach(subscription => subscription.unsubscribe());

    }

}
