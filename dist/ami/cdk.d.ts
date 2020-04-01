export declare namespace AmiBuilder {
    class AmiMap {
        static allRegions(amiName: string): Promise<{
            [key: string]: string;
        }>;
    }
}
