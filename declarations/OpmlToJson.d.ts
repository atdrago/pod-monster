/* eslint-disable @typescript-eslint/naming-convention */
declare module 'opml-to-json' {
  export interface ExternalOpmlOutline {
    children?: Array<ExternalOpmlOutline>;
    htmlurl?: string;
    text?: string;
    title?: string;
    type?: 'rss' | 'atom';
    xmlurl?: string;
  }

  export interface ExternalOpmlFile {
    children?: Array<ExternalOpmlOutline>;
    title: string;
  }

  export declare const opmlToJSON: (xml: string) => Promise<ExternalOpmlFile>;
  export {};
}
