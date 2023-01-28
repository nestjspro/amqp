import { Test, TestingModule } from '@nestjs/testing';
import { AMQPConfig, AMQPLogLevel, AMQPModule, AMQPService } from '../src';

jest.setTimeout(15000);

describe('AMQPModule Test', () => {

    let app;
    let amqpService: AMQPService;

    beforeAll(async () => {

        const module: TestingModule = await Test.createTestingModule({

            imports: [

                AMQPModule.forRoot(new AMQPConfig({

                    logLevel: AMQPLogLevel.TRACE,
                    autoConnect: true,
                    connections: [

                        {

                            name: 'one',
                            url: 'amqp://rabbitmq:agaeq14@localhost:5672',
                            autoConnect: true,
                            autoReconnect: true,
                            exchange: {

                                name: 'connection-test-1',
                                type: 'topic',
                                options: {

                                    durable: true

                                }

                            },
                            queues: [

                                {

                                    name: 'connection-1',
                                    routingKey: 'connection-111',
                                    createBindings: true,
                                    options: {

                                        durable: false

                                    }

                                }

                            ]

                        }, {

                            name: 'two',
                            url: 'amqp://rabbitmq:agaeq14@localhost:5672',
                            autoConnect: true,
                            autoReconnect: true,
                            exchange: {

                                name: 'connection-test-2',
                                type: 'topic',
                                options: {

                                    durable: true

                                }

                            },
                            queues: [

                                {

                                    name: 'connection-2',
                                    routingKey: 'connection-222',
                                    createBindings: true,
                                    options: {

                                        durable: false

                                    }

                                }

                            ]

                        }

                    ]

                }))

            ]

        }).compile();

        app = module.createNestApplication();

        await app.init();

        amqpService = module.get<AMQPService>(AMQPService);

        // amqpService.connect();

    });

    test('AMQPConnection->Connections', async => {

        return new Promise<void>(resolve => {

            amqpService.getConnection('one').subscribe(connection => {

                setTimeout(() => {

                    connection.disconnect();

                    resolve();

                }, 3000);

            });

        });

    });

});
