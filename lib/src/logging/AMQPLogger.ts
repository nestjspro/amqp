import { AMQPLogLevel } from './AMQPLogLevel';
import * as chalk from 'chalk';
import { cyan } from 'chalk';
import { Injectable } from '@nestjs/common';
import { AMQPConfig } from '../configuration/AMQPConfig';

/**
 * Global log messaging.
 */
@Injectable()
export class AMQPLogger {

    /**
     * List of colors mapped by log level value.
     *
     * @type {chalk.Chalk[]}
     */
    public static LOG_LEVEL_COLORS = [ cyan.redBright, cyan.yellowBright, cyan.magenta, cyan.gray ];

    public static pad(str: string, padLeft = ' '): string {

        const pad = '                   ';

        return (pad + str).slice(-pad.length) + ' ';

    }

    /**
     * Main configuration for getting the log level from.
     *
     * @type {AMQPConfig}
     */
    public config: AMQPConfig;

    /**
     * console.log log messages.
     *
     * @param {AMQPLogLevel} logLevel Level to output.
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public log(logLevel: AMQPLogLevel, message: string, emoji?: string, context?: string): string {

        if (this.config.logLevel >= logLevel) {

            let str = `[${ chalk.cyan('@nestjs.pro/amqp') }] ${ chalk.gray(new Date().toLocaleString()) } `;

            if (context) {

                str += `${ chalk.bgGrey(AMQPLogger.pad(context)) } `;

            }

            str += `${ AMQPLogger.LOG_LEVEL_COLORS[ logLevel ](AMQPLogLevel[ logLevel ]) }: `;

            if (emoji) {

                str += `${ emoji }`;
            }

            console.log(`${ str } ${ message }`);

            return `${ str } ${ message }`;

        }

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public error(message: string, emoji?: string, context?: string): string {

        return this.log(AMQPLogLevel.ERROR, message, emoji, context);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public info(message: string, emoji?: string, context?: string): string {

        return this.log(AMQPLogLevel.INFO, message, emoji, context);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji Emojis make life better.
     * @param {string?} context Optional context to prepend to message.
     */
    public debug(message: string, emoji?: string, context?: string): string {

        return this.log(AMQPLogLevel.DEBUG, message, emoji, context);

    }

    /**
     * Wrapper method.
     *
     * @param {string} message Message to emit.
     * @param {string} emoji (optional) Emojis make life better.
     * @param {string?} context (optional) context to prepend to message.
     */
    public trace(message: string, emoji?: string, context?: string): string {

        return this.log(AMQPLogLevel.TRACE, message, emoji, context);

    }

}
