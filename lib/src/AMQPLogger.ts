import { AMQPLogLevel } from './AMQPLogLevel';
import * as chalk from 'chalk';
import { cyan } from 'chalk';

/**
 * Global log messaging.
 */
export class AMQPLogger {

    /**
     * List of colors mapped by log level value.
     *
     * @type {chalk.Chalk[]}
     */
    public static LOG_LEVEL_COLORS = [ cyan.redBright, cyan.yellowBright, cyan.magenta, cyan.gray ];

    /**
     * console.log log messages using some fancy colors.
     *
     * @param {AMQPLogLevel} logLevel
     * @param {string} message
     */
    public static log(logLevel: AMQPLogLevel, message: string): void {

        console.log(`[${ chalk.cyan('@nestjs.pro/amqp') }] ${ chalk.gray(new Date().toLocaleString()) } ${ this.LOG_LEVEL_COLORS[ logLevel ](AMQPLogLevel[ logLevel ]) }: ${ message }`);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message
     */
    public static error(message: string): void {

        this.log(AMQPLogLevel.ERROR, message);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message
     */
    public static info(message: string): void {

        this.log(AMQPLogLevel.INFO, message);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message
     */
    public static debug(message: string): void {

        this.log(AMQPLogLevel.DEBUG, message);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message
     */
    public static trace(message: string): void {

        this.log(AMQPLogLevel.TRACE, message);

    }

}
