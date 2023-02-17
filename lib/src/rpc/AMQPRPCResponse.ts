export interface AMQPRPCResponse<T> {
    result: boolean;
    content: T;
}
