# AMQP for Nest.js like a boss. 💪

![amqp](assets/amqp-hero.jpg)

This module implements an AMQP pub/sub + RPC scalable & fault tolerant interface for [Nest.js](https://nestjs.com).

[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/83f5be74f9c7488184bac4ee6e441154)](https://www.codacy.com/gh/nestjspro/amqp/dashboard?utm_source=github.com&utm_medium=referral&utm_content=nestjspro/amqp&utm_campaign=Badge_Coverage)

# ⚡ Features

* Configurable as a module + programatically add connections on the fly.
* 100% Rxjs based with typings.
* Supports __multiple__ connections.
* Auto-magic reconnection. 🙏
* Offline _queueing_ support to handle disconnects.
* Handles exchange, queue, and routing key bindings for you.
* Pub/sub + RPC support.
* Shutdown signal trap for graceful shutdown. 💣
* Configurable, verbose, logging facility.
* Hackable and extensible. 🧰
* [Demo](app/src) implementation.

[![asciicast](https://asciinema.org/a/444797.svg?autoplay=1&loop=1&rows=35)](https://asciinema.org/a/444797?autoplay=1&loop=1&rows=35)
![integration](https://github.com/nestjspro/amqp/actions/workflows/integration.yml/badge.svg)
![documentation](https://github.com/nestjspro/amqp/actions/workflows/documentation.yml/badge.svg)

# 🛴 Installation

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

            //
            // no secrets, log what is actually happening under the hood!
            //
            logLevel: AMQPLogLevel.DEBUG,

            //
            // add multiple connections if required..
            //
            connections: [

                {

                    name: 'one',
                    uri: 'amqp://rabbitmq:rabbitmq@localhost:5672',
                    exchange: {

                        name: 'test-1',
                        type: 'topic',
                        options: {

                            durable: true
                            // all other amqplib options supported..

                        }

                    },
                    queues: [

                        {

                            name: '1',
                            routingKey: '111',
                            createBindings: true,
                            options: {

                                durable: false
                                // all other amqplib options supported..

                            }

                        }

                        // add more queues..

                    ]

                }

                // add more connections to your hearts desire..

            ]

        })

    ],

    providers: [ AppService ]

})
export class AppModule {
}
```

## Service Implementation

See [app/src/AppService.ts](app/src/AppService.ts) for a complete implementation.

```typescript
import { Injectable } from '@nestjs/common';
import { AMQPService } from '@nestjs.pro/amqp/dist/AMQPService';
import { AMQPConnectionStatus } from '@nestjs.pro/amqp/dist/AMQPConnectionStatus';

@Injectable()
export class AppService {

    //
    // Inject in to your service(s)..
    //
    public constructor(private readonly amqpService: AMQPService) {

        //
        // Retrieve the connection named "one" and do some magic..
        //
        amqpService.getConnection('one').subscribe(connection => {

            //
            // Now that we're connected, publish a message..
            //
            connection.queue.publishJSON('test-1', 111, { date: new Date(), rand: Math.random() });

            // ..other fancy work happenin here..

            //
            // Optionally remove the exchange, queue, and routing keys if you want..
            //
            amqpService.tearDown().subscribe(() => {

                console.log('DEMO: Tear down complete, all remaining exchange(s) and queue(s) removed! 🏁');

                //
                // Disconnect gracefully now that we've cleaned things up..
                //
                amqpService.disconnect();

            });

        });

    }

}
```

# 👐 Contributing/Hacking

Pull down this repo and install the dependencies using [pnpm](https://pnpm.io):

> If you do not have pnpm installed simply run the following:
> `npm install -g pnpm`

Next we can compile the library out to the `dist` directory:

```shell
npx tsc -w
```

Finally, we just need to start the demo implementation:

```shell
npm run start:dev
```

---

```shell
git clone https://github.com/mateothegreat/nestjspro-amqp
cd nestjspro-amqp

pnpm install
```

Enjoy!

# ❔ Help

* [Public Discord](https://discord.gg/b4Mf3GVpaF)
* https://github.com/nestjspro/amqp/issues

```shell
                    __    _                       
   ____  ___  _____/ /_  (_)____  ____  _________ 
  / __ \/ _ \/ ___/ __/ / / ___/ / __ \/ ___/ __ \
 / / / /  __(__  ) /_  / (__  ) / /_/ / /  / /_/ /
/_/ /_/\___/____/\__/_/ /____(_) .___/_/   \____/ 
                   /___/      /_/                 
```

https://github.com/nestjspro
