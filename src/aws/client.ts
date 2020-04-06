import * as AWS from 'aws-sdk'


interface AWSProps {
    region?: string
    accessKeyId?: string
    secretAccessKey?: string
    sessionKey?: string
    profile?: string
}

export class AWSClient {

    public static conf: AWSProps = {}

    static config(): void {
        if (Object.keys(AWSClient.conf).length <= 0) {
            return
        }
        if (AWSClient.conf.profile) {
            // set profile credentials
        } else {
            AWS.config.update(AWSClient.conf)
        }
    }

    /**
     * Return an AWS Service client with
     * the credentials stored in AWSClient.conf
     *
     * @param name (string): The name of the service
     */
    static client(name: string, conf?: AWSProps): AWS.Service {
        AWSClient.config()
        let cprops: AWSProps = {}
        if (conf != undefined) {
            cprops = {...AWSClient.conf, ...conf}
        }
        let c = new (<any>AWS)[name](cprops)
        return c

    }

}

export const clientFactory = <T>(service: string, conf: AWSProps = {}) => {
    
    console.log("TYPE: ",  T&Function.name as string)
    let cprops: AWSProps = {}
    if (conf != undefined) {
        cprops = {...AWSClient.conf, ...conf}
    }
    //let c = new (<any>AWS)[name](cprops) as T
    let c = new (<any>AWS)[service](cprops) as T

    return c
}
