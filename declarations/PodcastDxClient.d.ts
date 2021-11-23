/* eslint-disable @typescript-eslint/naming-convention */
export declare module 'podcastdx-client/src/types' {
  export interface PIApiEpisodeDetail {
    persons?: Array<{
      group?: string;
      href?: string;
      id: number;
      img?: string;
      name: string;
      role?: string;
    }> | null;
    transcripts: Array<{
      type: string;
      url: string;
    }> | null;
  }
}
