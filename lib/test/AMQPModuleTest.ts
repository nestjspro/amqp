import { AMQPService, AMQPModule, AMQPLogLevel, AMQPConnectionStatus, AMQPMessage } from '../dist';
import { TestingModule, Test } from '@nestjs/testing';
import { ConsumeMessage } from 'amqplib';

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

    test('AMQPConnection', async () => {

        await expect(amqpService.connections[ 0 ].config).toBeTruthy();
        await expect(amqpService.connections.length).toEqual(2);

        amqpService.getConnection('two').subscribe(async connection => {

            await expect(connection.status).toEqual(AMQPConnectionStatus.DISCONNECTED);

        });


        return new Promise<void>(resolve => {

            expect(1).toEqual(1);

            resolve();

        });

    });

    test('Publish Message', async () => {

        return new Promise<void>(resolve => {

            amqpService.getConnection('two').subscribe(connection => {

                connection.queue.publish({ exchange: 'test-1', message: Buffer.from('a'), routingKey: '1' });

                expect(connection.config).toBeTruthy();

                resolve();

            });

        });

    });

    test('AMQPMessage', () => {

        const message = new AMQPMessage({

            content: Buffer.from(JSON.stringify({ a: 1, b: 2 }))

        } as ConsumeMessage);

        return expect(message.fromJSON()).toBeTruthy();

    });

    afterAll(async () => {

        amqpService.disconnect();

        await app.close();

        return new Promise<void>(resolve => {

            setTimeout(() => {

                resolve();

            }, 1000);

        });

    });

});
