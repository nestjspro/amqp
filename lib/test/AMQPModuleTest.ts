import {
    AMQPService,
    AMQPModule,
    AMQPLogLevel,
    AMQPMessage,
    AMQPLogger,
    AMQPConnectionNotFoundException,
    AMQPPublishException,
    AMQPConnectionStatus
} from '../src';
import { TestingModule, Test } from '@nestjs/testing';
import { ConsumeMessage } from 'amqplib';
import { first, of } from 'rxjs';

jest.setTimeout(15000);

describe('AMQPModule Test', () => {

    let app;
    let amqpService: AMQPService;

    beforeAll(async () => {

        const module: TestingModule = await Test.createTestingModule({

            imports: [

                AMQPModule.forRoot({

                    logLevel: AMQPLogLevel.ERROR,
                    connections: [

                        {

                            name: 'one',
                            url: 'amqp://rabbitmq:agaeq14@localhost:5672',
                            exchange: {

                                name: 'test-1',
                                type: 'topic',
                                options: {

                                    durable: true

                                }

                            },
                            queues: [

                                {

                                    name: '1',
                                    routingKey: '111',
                                    createBindings: true,
                                    options: {

                                        durable: false

                                    }

                                }

                            ]

                        }, {

                            name: 'two',
                            url: 'amqp://rabbitmq:agaeq14@localhost:5672',
                            exchange: {

                                name: 'test-2',
                                type: 'topic',
                                options: {

                                    durable: true

                                }

                            },
                            queues: [

                                {

                                    name: '2',
                                    routingKey: '222',
                                    createBindings: true,
                                    options: {

                                        durable: false

                                    }

                                }

                            ]

                        }

                    ]

                })

            ]

        }).compile();

        app = module.createNestApplication();

        await app.init();

        amqpService = module.get<AMQPService>(AMQPService);

    });

    test('AMQPConnection->Connections', async () => {

        try {

            expect(amqpService.getConnection()).toThrowError('There is no existing connection named "bad".');

        } catch (e) {

            //

        }
        try {

            expect(amqpService.getConnection('bad')).toThrowError('There is no existing connection named "bad".');

        } catch (e) {

            //

        }

        expect(amqpService.connect()).toBeTruthy();


    });

    test('AMQPConnection->Reconnection', done => {

        amqpService.getConnection('one').subscribe(connection => {

            connection.reconnect().subscribe(() => {

                done();

            });

        });

    });

    // test('AMQPQueue->RPC (using buffer)', done => {
    //
    //     amqpService.getConnection('two').subscribe(async connection => {
    //
    //         connection.rpcConsume('rpc', message => {
    //
    //             return of(Buffer.from(JSON.stringify(message.fromJSON())));
    //
    //         }).subscribe(() => {
    //
    //             connection.rpcCall({
    //
    //                 queue: 'rpc',
    //                 message: Buffer.from(JSON.stringify({ a: 123 })),
    //                 timeout: 5000
    //
    //             }).subscribe(response => {
    //
    //                 console.log(response);
    //                 expect(JSON.parse(response.message.content.toString())[ 'a' ]).toEqual(123);
    //
    //                 done();
    //
    //             });
    //
    //         });
    //
    //     });
    //
    // });

    test('AMQPQueue->RPC (using an object)', done => {

        amqpService.getConnection('two').subscribe(async connection => {

            connection.rpcConsume('rpc', message => {

                return of({

                    result: true,
                    wtf: 123123,
                    content: message.fromJSON()

                });

            }).subscribe(() => {

                connection.rpcCall<{ a: number }>({

                    queue: 'rpc',
                    message: { a: 123 },
                    timeout: 5000

                }).subscribe(response => {

                    expect(response.fromJSON().content.a).toEqual(123);

                    done();

                });

            });

        });

    });

    test('AMQPConnection->Publish', async () => {

        return new Promise<void>(resolve => {

            amqpService.getConnection('two').subscribe(async connection => {

                expect(connection.status).toBeTruthy();

                connection.queue.publishJSON('test-1', '1', { a: 1 }).subscribe(result => {

                    expect(result).toBeTruthy();

                });

                expect(connection.config).toBeTruthy();

                resolve();

            });

        });

    });

    test('AMQPQueue->subscribe(..)', done => {

        amqpService.getConnection('two').subscribe(async connection => {

            // expect(connection.queue.connection.status).toBeTruthy();

            connection.subscribe({ queue: '1' }).pipe(first()).subscribe(message => {

                // message.ack();

                done();

            });

            connection.queue.publishJSON('test-1', '111', { a: 1 });

            done();

        });

    });

    test('AMQPQueue->Drain', done => {

        amqpService.getConnection('two').subscribe(async connection => {

            connection.queue.drain({ exchange: 'test-2', routingKey: '222', message: Buffer.from('a') });

            done();

        });

    });

    test('Logger', () => {

        expect(amqpService.logger.error('a', '🙏', 'testing')).toBeTruthy();

        return expect(AMQPLogger.pad('a', ' ')).toBeTruthy();

    });

    test('AMQPMessage', () => {

        const message = new AMQPMessage({

            content: Buffer.from(JSON.stringify({ a: 1, b: 2 }))

        } as ConsumeMessage);

        return expect(message.fromJSON()).toBeTruthy();

    });

    test('Exceptions', () => {

        expect(new AMQPConnectionNotFoundException('test')).toBeTruthy();
        expect(new AMQPPublishException('test')).toBeTruthy();

    });

    test('AMQPConnection.setStatus()', done => {

        amqpService.getConnection('two').subscribe(async connection => {

            connection.setStatus(AMQPConnectionStatus.DISCONNECTED);

            expect(connection.status).toEqual(AMQPConnectionStatus.DISCONNECTED);

            done();

        });

    });

    test('AMQPConnection->Clean up', done => {

        amqpService.getConnection('two').subscribe(connection => {

            connection.tearDown().subscribe(async () => {

                await connection.disconnect();

                done();

            });

        });

    });

    test('AMQPService->Clean up', done => {

        amqpService.tearDown();

        done();

    });

    afterAll(async () => {

        amqpService.disconnect();

        await app.close();

    });

});
