import Document, {
  type DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import { localeMeta } from '../i18n';
import { localeFromCookie } from '../utils/locale';

export default class MakaanDocument extends Document<{ locale: 'ar' | 'en' }> {
  static async getInitialProps(context: DocumentContext) {
    const initialProps = await Document.getInitialProps(context);
    return {
      ...initialProps,
      locale: localeFromCookie(context.req?.headers.cookie),
    };
  }

  render() {
    const locale = this.props.locale ?? 'ar';
    return (
      <Html dir={localeMeta[locale].direction} lang={locale}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
