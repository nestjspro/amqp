import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import * as chalk from 'chalk';
import { BehaviorSubject, filter, forkJoin, map, Observable, pipe, ReplaySubject, Subject, tap } from 'rxjs';
import { AMQPConfig } from './configuration/AMQPConfig';
import { AMQPConfigConnection } from './configuration/AMQPConfigConnection';
import { AMQPConnection } from './connections/AMQPConnection';
import { AMQPConnectionNotFoundException } from './exceptions/AMQPConnectionNotFoundException';
import { AMQPLogEmoji } from './logging/AMQPLogEmoji';
import { AMQPLogger } from './logging/AMQPLogger';

@Injectable()
export class AMQPService implements OnModuleDestroy {
    public config: AMQPConfig;
    public connections: Array<AMQPConnection> = [];
    public connections$: ReplaySubject<Array<AMQPConnection>> = new ReplaySubject();

    public constructor(@Inject('AMQP_CONFIG') config: AMQPConfig, public readonly logger: AMQPLogger) {
        this.config = config;
        this.logger.config = config;

        if (this.config.autoConnect) {
            this.connect();
        }
    }

    public connect(): boolean {
        this.logger.debug('Creating connections..', AMQPLogEmoji.NEW, 'SERVICE MANAGER');

        if (this.connections.length === 0) {
            for (let i = 0; i < this.config.connections.length; i++) {
                this.addConnection(this.config.connections[i]);
            }
        } else {
            for (let i = 0; i < this.connections.length; i++) {
                this.connections[i].connect();
            }
        }

        return true;
    }

    public disconnect(): void {
        for (let i = 0; i < this.connections.length; i++) {
            this.logger.debug(
                `Disconnecting from amqp server "${ chalk.yellowBright(this.connections[i].config.name ? this.connections[i].config.name : '#0') }"`,
                AMQPLogEmoji.DISCONNECT,
                'SERVICE MANAGER'
            );

            this.connections[i].disconnect();
        }

        this.logger.debug('All connections have been disconnected!', AMQPLogEmoji.DISCONNECT, 'SERVICE MANAGER');
    }

    public tearDown(): Observable<Array<unknown>> {
        return forkJoin(this.connections.map(connection => connection.tearDown));
    }

    public addConnection(config: AMQPConfigConnection): AMQPConnection {
        this.logger.debug(`Creating connection to amqp server "${ chalk.yellowBright(config.name ? config.name : '#0') }"`, AMQPLogEmoji.NEW, 'SERVICE MANAGER');

        const connection = new AMQPConnection(config, this.logger, this.config);

        this.connections.push(connection);
        this.connections$.next(this.connections);

        return connection;
    }

    public getConnection(name?: string): Observable<AMQPConnection> {
        this.logger.trace(`Attempting to get connection "${ chalk.yellowBright(name ? name : '#0') }"`, AMQPLogEmoji.NEW, 'SERVICE MANAGER');

        return this.connections$.pipe(
            map(connections => {
                    if (name) {
                        return connections.find(connection => connection.config.name === name);
                    } else {
                        return connections[0];
                    }
                }
            ),
            tap(connection => {
                if (connection) {
                    this.logger.trace(`Retrieved connection "${ chalk.yellowBright(connection.config.name) }"!`, AMQPLogEmoji.SUCCESS, 'SERVICE MANAGER');
                } else {
                    throw new AMQPConnectionNotFoundException(`There is no existing connection named "${ chalk.yellowBright(name) }".`);
                }
            })
        );
    }

    public onModuleDestroy(): void {
        this.logger.debug(chalk.magentaBright('Received shutdown signal, shutting down..'), AMQPLogEmoji.SUCCESS, 'SERVICE MANAGER');

        this.disconnect();
    }
}
