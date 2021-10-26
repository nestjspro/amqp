import { Module, DynamicModule } from '@nestjs/common';
import { AMQPConfig } from './AMQPConfig';
import { AMQPPublisher } from './AMQPPublisher';
import { AMQPService } from './AMQPService';

@Module({})
export class AMQPModule {

    public static forRoot(config: AMQPConfig): DynamicModule {

        return {

            module: AMQPModule,

            providers: [

                AMQPPublisher,
                AMQPService,
                {

                    provide: 'AMQP_CONFIG',
                    useValue: config

                }

            ],

            exports: [

                AMQPService

            ]

        };

    }

}
