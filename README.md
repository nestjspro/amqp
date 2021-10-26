# AMQP for Nest.js like a boss. 💪

[![asciicast](https://asciinema.org/a/444774.png)](https://asciinema.org/a/444774)

# 🧰 Features

* Configurable as a module + programatically add connections on the fly.
* 100% Rxjs based with typings.
* Supports __multiple__ connections.
* Auto-magic reconnection. 🙏
* Configurable, verbose, logging facility.
* Pub/sub + RPC support.
* Demo implementation.
* Hackable and extensible.

# Installation

```shell
npm install @nestjs.pro/amqp
```

```typescript
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
                    uri: 'amqp://rabbitmq:rabbitmq@localhost:5672',
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
                    uri: 'amqp://rabbitmq:rabbitmq@localhost:5672',
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
```

```shell
                    __    _                       
   ____  ___  _____/ /_  (_)____  ____  _________ 
  / __ \/ _ \/ ___/ __/ / / ___/ / __ \/ ___/ __ \
 / / / /  __(__  ) /_  / (__  ) / /_/ / /  / /_/ /
/_/ /_/\___/____/\__/_/ /____(_) .___/_/   \____/ 
                   /___/      /_/                 
```

https://github.com/nestjspro
