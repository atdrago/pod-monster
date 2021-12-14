export interface IOpmlOutline {
  htmlUrl: string;
  text: string;
  title: string;
  type: 'rss' | 'atom';
  xmlUrl: string;
}

export interface IOpmlFile {
  children: Array<IOpmlOutline>;
  title: string;
}
