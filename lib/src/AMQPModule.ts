import { Module, DynamicModule } from '@nestjs/common';
import { AMQPConfig } from './configuration/AMQPConfig';
import { AMQPService } from './AMQPService';
import { AMQPLogger } from './logging/AMQPLogger';

@Module({})
export class AMQPModule {
    public static forRoot(config: AMQPConfig): DynamicModule {
        return {
            module: AMQPModule,

            providers: [
                AMQPLogger,
                AMQPService,
                {
                    provide: 'AMQP_CONFIG',
                    useValue: config
                }
            ],

            exports: [AMQPService]
        };
    }
}
