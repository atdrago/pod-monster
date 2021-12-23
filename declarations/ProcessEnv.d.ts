declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  export interface ProcessEnv {
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_BASE_URL: string;
    NEXT_PUBLIC_LOGFLARE_API_KEY: string;
    NEXT_PUBLIC_LOGFLARE_SOURCE_TOKEN: string;
    NEXT_PUBLIC_PODCAST_INDEX_API_KEY: string;
    NEXT_PUBLIC_PODCAST_INDEX_API_SECRET: string;
  }
}
