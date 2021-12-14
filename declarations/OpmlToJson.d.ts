/* eslint-disable @typescript-eslint/naming-convention */
declare module 'opml-to-json' {
  interface ExternalOpmlOutline {
    htmlurl: string;
    text: string;
    title: string;
    type: 'rss' | 'atom';
    xmlurl: string;
  }

  interface ExternalOpmlFile {
    children: Array<ExternalOpmlOutline>;
    title: string;
  }

  export declare const opmlToJSON: (xml: string) => Promise<ExternalOpmlFile>;
  export {};
}
