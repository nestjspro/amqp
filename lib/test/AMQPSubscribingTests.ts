import { AMQPService } from '../src';

const amqpService: AMQPService;

amqpService.getConnection('one').subscribe(connection => {
    connection.subscribe({ queue: 'foo.queue' }).subscribe(async message => {
        console.log(message.fromJSON());
        message.handlers.ack();
    });
});
