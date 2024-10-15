export interface OpmlOutline {
  htmlUrl: string;
  text: string;
  title: string;
  type: 'rss' | 'atom';
  xmlUrl: string;
}

export interface OpmlFile {
  children: Array<OpmlOutline>;
  title: string;
}
