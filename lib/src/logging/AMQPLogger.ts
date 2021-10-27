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

    public static pad(str: string, padLeft = ' ') {

        const pad = '                   ';

        if (typeof str === 'undefined') {

            return pad;

        }

        if (padLeft) {

            return (pad + str).slice(-pad.length) + ' ';

        } else {

            return (str + pad).substring(0, pad.length) + ' ';

        }

    }

    /**
     * console.log log messages.
     *
     * @param {AMQPLogLevel} logLevel Level to output.
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public static log(logLevel: AMQPLogLevel, message: string, emoji?: string, context?: string): void {

        let str = `[${ chalk.cyan('@nestjs.pro/amqp') }] ${ chalk.gray(new Date().toLocaleString()) } `;

        if (context) {

            str += `${ chalk.bgGrey(this.pad(context)) } `;

        }

        str += `${ this.LOG_LEVEL_COLORS[ logLevel ](AMQPLogLevel[ logLevel ]) }: `;

        if (emoji) {

            str += `${ emoji }`;
        }

        console.log(`${ str } ${ message }`);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public static error(message: string, emoji?: string, context?: string): void {

        this.log(AMQPLogLevel.ERROR, message, emoji, context);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public static info(message: string, emoji?: string, context?: string): void {

        this.log(AMQPLogLevel.INFO, message, emoji, context);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji Emojis make life better.
     * @param {string?} context Optional context to prepend to message.
     */
    public static debug(message: string, emoji?: string, context?: string): void {

        this.log(AMQPLogLevel.DEBUG, message, emoji, context);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public static trace(message: string, emoji?: string, context?: string): void {

        this.log(AMQPLogLevel.TRACE, message, emoji, context);

    }

}
