import { Module } from '@nestjs/common';
import { AppService } from './AppService';
import { AMQPModule } from '@nestjs.pro/amqp/dist/AMQPModule';
import { AMQPLogLevel } from '@nestjs.pro/amqp/dist/AMQPLogLevel';

@Module({

    imports: [

        AMQPModule.forRoot({

            logLevel: AMQPLogLevel.DEBUG,
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

    ],

    providers: [ AppService ]

})
export class AppModule {

}
