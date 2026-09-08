import Document, {
  type DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import { localeMeta } from '../i18n';
import { localeFromCookie } from '../utils/locale';
import {
  themeBootstrapScript,
  themeFromCookie,
  type ThemePreference,
} from '../utils/theme';

type DocumentProps = { locale: 'ar' | 'en'; theme: ThemePreference };

export default class MakaanDocument extends Document<DocumentProps> {
  static async getInitialProps(context: DocumentContext) {
    const initialProps = await Document.getInitialProps(context);
    const cookie = context.req?.headers.cookie;
    return {
      ...initialProps,
      locale: localeFromCookie(cookie),
      theme: themeFromCookie(cookie),
    };
  }

  render() {
    const locale = this.props.locale ?? 'ar';
    const theme = this.props.theme ?? 'system';
    return (
      <Html
        // An explicit preference is painted from the very first byte; `system`
        // is settled by the pre-paint script below, before anything renders.
        className={theme === 'dark' ? 'dark' : undefined}
        data-theme={theme === 'system' ? undefined : theme}
        dir={localeMeta[locale].direction}
        lang={locale}
      >
        <Head>
          <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
          <meta
            content="rgb(246 244 239)"
            media="(prefers-color-scheme: light)"
            name="theme-color"
          />
          <meta
            content="rgb(10 18 16)"
            media="(prefers-color-scheme: dark)"
            name="theme-color"
          />
          <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
