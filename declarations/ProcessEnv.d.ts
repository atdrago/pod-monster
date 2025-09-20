declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_BASE_URL: string;
    NEXT_PUBLIC_PODCAST_INDEX_API_KEY: string;
    NEXT_PUBLIC_PODCAST_INDEX_API_SECRET: string;
    /**
     * https://vercel.com/docs/environment-variables/system-environment-variables#VERCEL_ENV
     */
    VERCEL_ENV: 'production' | 'development' | 'preview';
  }
}
