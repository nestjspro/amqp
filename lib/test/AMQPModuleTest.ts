import { AMQPService, AMQPPublisher, AMQPModule } from '../dist';
import { TestingModule, Test } from '@nestjs/testing';

jest.setTimeout(15000);

describe('AMQPModule Test', () => {

    let app;

    test('asdf', async () => {

        const module: TestingModule = await Test.createTestingModule({

            imports: [

                AMQPModule.forRoot({

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
        const publisher = module.get(AMQPPublisher);

        // const connection = await service.getConnection().toPromise();
        //
        // expect(connection).toBeTruthy();

        // await app.close();
        expect(1).toEqual(1);

        service.disconnect();
        console.log(222);
        return new Promise<void>(resolve => {
            expect(1).toEqual(1);

            console.log(111);
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
        console.log(333);
        await app.close();
        console.log(444);
        return new Promise<void>(resolve => {
            console.log(534)
            ;
            setTimeout(() => {

                console.log(999);
                resolve();

            }, 1000);

        });

    });

});
