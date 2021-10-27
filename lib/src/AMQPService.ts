import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { AMQPConnection } from './AMQPConnection';
import { AMQPConfig } from './configuration/AMQPConfig';
import { AMQPConnectionNotFoundException } from './exceptions/AMQPConnectionNotFoundException';
import { ReplaySubject, forkJoin, Observable } from 'rxjs';
import { AMQPLogger } from './logging/AMQPLogger';
import * as chalk from 'chalk';
import { AMQPConfigConnection } from './configuration/AMQPConfigConnection';
import { AMQPLogEmoji } from './logging/AMQPLogEmoji';

@Injectable()
export class AMQPService implements OnModuleDestroy {

    public config: AMQPConfig;
    
    private connections: Array<AMQPConnection> = [];

    public constructor(@Inject('AMQP_CONFIG') config: AMQPConfig) {

        this.config = config;

        this.connect();

    }

    public connect() {

        AMQPLogger.trace('Creating connections..', AMQPLogEmoji.NEW, 'SERVICE MANAGER');

        for (let i = 0; i < this.config.connections.length; i++) {

            this.addConnection(this.config.connections[ i ]);

        }

    }

    public disconnect(): void {

        AMQPLogger.info('Disconnecting from all connections..');

        for (let i = 0; i < this.connections.length; i++) {

            AMQPLogger.debug(`Disconnecting from amqp server "${ chalk.yellowBright(this.connections[ i ].config.name ? this.connections[ i ].config.name : '#0') }"`, AMQPLogEmoji.DISCONNECT, 'SERVICE MANAGER');

            this.connections[ i ].disconnect();

        }

        AMQPLogger.debug('All connections have been disconnected!', AMQPLogEmoji.DISCONNECT, 'SERVICE MANAGER');

    }

    public tearDown(): Observable<Array<unknown>> {

        return forkJoin(this.connections.map(connection => connection.tearDown()));

    }

    public addConnection(config: AMQPConfigConnection): AMQPConnection {

        AMQPLogger.debug(`Creating connection to amqp server "${ chalk.yellowBright(config.name ? config.name : '#0') }"`, AMQPLogEmoji.NEW, 'SERVICE MANAGER');

        const connection = new AMQPConnection(config);

        this.connections.push(connection);

        return connection;

    }

    public getConnection(name?: string): ReplaySubject<AMQPConnection> {

        AMQPLogger.trace(`Attempting to get connection "${ chalk.yellowBright(name ? name : '#0') }"`, AMQPLogEmoji.NEW, 'SERVICE MANAGER');

        const subject$: ReplaySubject<AMQPConnection> = new ReplaySubject();

        if (name) {

            const connection = this.connections.find(connection => connection.config.name === name);

            if (connection) {

                AMQPLogger.trace(`Retrieved connection "${ chalk.yellowBright(connection.config.name) }"!`, AMQPLogEmoji.SUCCESS, 'SERVICE MANAGER');

                subject$.next(connection);

            } else {

                throw new AMQPConnectionNotFoundException(`There is no existing connection named "${ chalk.yellowBright(name) }".`);

            }

        } else {

            if (this.connections && this.connections.length > 0) {

                AMQPLogger.trace(`Retrieved connection ${ chalk.yellowBright('#0!') }`, AMQPLogEmoji.SUCCESS, 'SERVICE MANAGER');

                subject$.next(this.connections[ 0 ]);

            } else {

                throw new AMQPConnectionNotFoundException('There are no connections.');

            }

        }

        return subject$;

    }

    public onModuleDestroy(): void {

        AMQPLogger.debug(chalk.magentaBright('Received shutdown signal, shutting down..'), AMQPLogEmoji.SUCCESS, 'SERVICE MANAGER');

        this.disconnect();

    }

}
