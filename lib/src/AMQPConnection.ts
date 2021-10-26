import * as amqp from 'amqplib';
import { AMQPConfigConnection } from './AMQPConfigConnection';
import { ReplaySubject, BehaviorSubject, Subject } from 'rxjs';
import { AMQPReference } from './AMQPReference';
import { AMQPConnectionStatus } from './AMQPConnectionStatus';
import { AMQPLogger } from './AMQPLogger';
import * as chalk from 'chalk';

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
     * AMQP individual connection class constructor (requires a configuration object).
     *
     * @author Matthew Davis <matthew@matthewdavis.io
     *
     * @param {AMQPConfigConnection} config
     */
    public constructor(config: AMQPConfigConnection) {

        AMQPLogger.trace(`Instantiating AMQP connection "${ chalk.yellowBright(config.name) }"..`);

        this.status = AMQPConnectionStatus.DISCONNECTED;

        this.config = config;

        this.connect();

        //
        // Subscribe to status changes so we can log them.
        //
        this.status$.subscribe(status => {

            AMQPLogger.debug(`Connection status changed to ${ chalk.greenBright(status) } for connection "${ chalk.yellowBright(this.config.name) }".`);

            console.log(status);
            if (status === AMQPConnectionStatus.CONNECTED) {

                this.declareResources().subscribe(() => {

                    AMQPLogger.debug(`AMQP connection "${ chalk.yellowBright(this.config.name) }" is ready!`);

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

                AMQPLogger.debug(`Deleting queue "${ this.config.queues[ i ].name }" on AMQP connection "${ this.config.name }"..`);

                await reference.channel.deleteQueue(this.config.queues[ i ].name);

            }

            AMQPLogger.debug(`Deleting queue "${ this.config.exchange.name }" on AMQP connection "${ this.config.name }"..`);

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

        AMQPLogger.debug(`Declaring AMQP resources for connection "${ chalk.yellowBright(this.config.name) }"..`);

        const subject$: Subject<void> = new Subject();

        this.reference$.subscribe(async reference => {

            await reference.channel.assertExchange(this.config.exchange.name, this.config.exchange.type, this.config.exchange.options);

            for (let i = 0; i < this.config.queues.length; i++) {

                if (this.config.queues[ i ].createBindings) {

                    await reference.channel.assertQueue(this.config.queues[ i ].name);
                    AMQPLogger.debug(`Declared the queue "${ chalk.yellowBright(this.config.queues[ i ].name) }" for connection "${ chalk.yellowBright(this.config.name) }"..`);

                    await reference.channel.bindQueue(this.config.queues[ i ].name, this.config.exchange.name, this.config.queues[ i ].routingKey);
                    AMQPLogger.debug(`Binded the queue "${ chalk.yellowBright(this.config.queues[ i ].name) }" for connection "${ chalk.yellowBright(this.config.name) }"..`);

                }

            }

            subject$.next();

        });

        return subject$;

    }

    public publish(routingKey: string, message: string): void {

        this.reference$.subscribe(reference => {

            reference.channel.publish(this.config.exchange.name, routingKey, Buffer.from(message));

        });

    }

    public publishJSON(routingKey: string, message: Object): void {

        this.publish(routingKey, JSON.stringify(message));

    }

    public setStatus(status: AMQPConnectionStatus): void {

        this.status$.next(status);

        this.status = status;

    }

}
