import { TestingModule, Test } from '@nestjs/testing';
import { AMQPModule } from '../src/AMQPModule';
import { AMQPPublisher } from '../src/AMQPPublisher';
import { AMQPService } from '../src/AMQPService';

describe('AMQPModule Test', () => {


    test('asdf', async () => {

        const module: TestingModule = await Test.createTestingModule({

            imports: [

                AMQPModule.forRoot({

                    connections: [

                        {

                            name: 'default',
                            uri: 'amqp://rabbitmq:agaeq14@localhost:5672',
                            exchange: {

                                name: 'test-1111',
                                type: 'topic',
                                options: {

                                    durable: true

                                }

                            }

                        }

                    ]

                })

            ]

        }).compile();

        const app = module.createNestApplication();
        await app.init();

        const service = module.get(AMQPService);
        const publisher = module.get(AMQPPublisher);

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

});
