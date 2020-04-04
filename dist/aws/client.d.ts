import * as AWS from 'aws-sdk';
interface AWSProps {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionKey?: string;
    profile?: string;
}
export declare class AWSClient {
    static conf: AWSProps;
    static config(): void;
    /**
     * Return an AWS Service client with
     * the credentials stored in AWSClient.conf
     *
     * @param name (string): The name of the service
     */
    static client(name: string, conf?: AWSProps): AWS.Service;
    static testMethod(): string;
}
export {};
