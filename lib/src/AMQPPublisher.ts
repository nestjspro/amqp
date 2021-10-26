import * as amqp from 'amqplib';

export class AMQPPublisher {

    public amqp: any;

    public async connect() {

        this.amqp = await amqp.connect('amqp://rabbitmq:agaeq14@localhost:5672');

        console.log(this.amqp);

    }

}
