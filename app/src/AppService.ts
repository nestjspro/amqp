import { Injectable } from '@nestjs/common';
import { AMQPService } from '@nestjs.pro/amqp/dist/AMQPService';
import { interval, map } from 'rxjs';
import { AMQPLogEmoji } from '@nestjs.pro/amqp/dist';

@Injectable()
export class AppService {

    public constructor(private readonly amqpService: AMQPService) {

        //
        // Retrieve the connection named "one".
        //
        amqpService.getConnection('one').subscribe(connection => {

            console.log('DEMO: AMQP is connected! ✅');

            // setTimeout(async () => {
            //
            //     await amqpService.disconnect();
            //
            //     setTimeout(() => {
            //
            //         amqpService.connect();
            //
            //     }, 2000);
            //
            // }, 3000);
            // connection.subscribe({ queue: '1' }).subscribe(payload => {
            //
            //     console.log(`---> from routingKey "${ payload.message.fields.routingKey }" via exchange "${ payload.message.fields.exchange }" subscription: ${ payload.message.content.toString() }`);
            //
            // });
            //
            connection.rpcConsume('t', message => {

                return 'hellow from rpc consumer!';

            }).subscribe(message => {

                // console.log(message);

            });

            setTimeout(() => {

                connection.rpcCall({

                    queue: 't',
                    message: Buffer.from(JSON.stringify({ date: new Date(), rand: Math.random() }))

                }).subscribe(response => {

                    this.amqpService.logger.debug(response.message.content.toString(), AMQPLogEmoji.SUCCESS, 'DEMO RPC->REPLY');

                });

            }, 2000);

            interval(1000).pipe(map(() => Math.floor(Math.random() * 100))).subscribe(t => {

                setTimeout(() => {

                    connection.queue.publishJSON('test-1', 111, { date: new Date(), rand: Math.random() });

                }, t);

            });

            //
            // Wait five seconds and then manually create a new
            // connection dynamically.
            //
            // setTimeout(() => {
            //
            //     console.log('DEMO: Manually creating a new connection.. 🙏');
            //
            //     amqpService.addConnection({
            //
            //         name: 'three',
            //         uri: 'amqp://rabbitmq:agaeq14@localhost:5672',
            //         exchange: {
            //
            //             name: 'test-3',
            //             type: 'topic',
            //             options: {
            //
            //                 durable: true
            //
            //             }
            //
            //         },
            //         queues: [
            //
            //             {
            //
            //                 name: '3',
            //                 routingKey: '333',
            //                 options: {
            //
            //                     durable: false
            //
            //                 }
            //
            //             }
            //
            //         ]
            //
            //     }).status$.subscribe(status => {
            //
            //         if (status === AMQPConnectionStatus.CONNECTED) {
            //
            //             console.log('DEMO: The new connection was established! 👏');
            //
            //         }
            //
            //     });
            //
            // }, 5000);
            //
            //
            // //
            // // Wait 10 seconds and then initiate a tear down to remove
            // // the exchange and queues for this connection only.
            // //
            // setTimeout(() => {
            //
            //     connection.tearDown().subscribe(() => {
            //
            //         console.log('DEMO: Tear down complete, exchange and queue(s) removed! 🏁');
            //
            //     });
            //
            // }, 10000);

        });


        //
        // Wait 15 seconds and then initiate a tear down to remove
        // the exchange and queues for the remaining connections.
        //
        // setTimeout(() => {
        //
        //     amqpService.tearDown().subscribe(() => {
        //
        //         console.log('DEMO: Tear down complete, all remaining exchange(s) and queue(s) removed! 🏁');
        //
        //     });
        //
        // }, 15000);
        //
        // //
        // // Wait 20 seconds and then initiate a disconnect programatically.
        // //
        // setTimeout(() => {
        //
        //     amqpService.disconnect();
        //
        //     console.log('DEMO: Disconnected! 🏁');
        //
        // }, 20000);

    }

}
