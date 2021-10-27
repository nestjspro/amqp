import { AMQPService, AMQPModule, AMQPLogLevel, AMQPConnectionStatus } from '../dist';
import { TestingModule, Test } from '@nestjs/testing';

jest.setTimeout(15000);

describe('AMQPModule Test', () => {

    let app;

    test('asdf', async () => {

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

        const service = module.get(AMQPService);

        service.getConnection('two').subscribe(connection => {

            expect(connection.status).toEqual(AMQPConnectionStatus.DISCONNECTED);

        });


        service.disconnect();

        return new Promise<void>(resolve => {

            expect(1).toEqual(1);

            resolve();
            
        });

        //
        // service.connections[ 0 ].reference$.subscribe(reference => {
        //     console.log(3);
        //     console.log(reference);
        //
        // });
        // console.log(4);
        // console.log(service.connections);
        // await publisher.connect();
        //
        // const channel = await publisher.amqp.createChannel();
        // console.log(channel);
        // console.log(await channel.assertExchange('test-2', 'topic'));
        //
        // await app.close();


    });

    afterAll(async () => {

        await app.close();

        return new Promise<void>(resolve => {

            setTimeout(() => {

                resolve();

            }, 1000);

        });

    });

});
