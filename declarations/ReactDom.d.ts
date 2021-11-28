declare module 'react-dom/server' {
  import type { ReactNode } from 'react';

  type ReactDomServer = {
    renderToStaticMarkup: (component: ReactNode) => string;
  };

  const defaultExport: ReactDomServer;

  export default defaultExport;
}
