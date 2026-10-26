import type { AppLocale } from '@/i18n/locales';

import en from '../../messages/en.json';
import ja from '../../messages/ja.json';
import zhCn from '../../messages/zh-cn.json';
import zhTw from '../../messages/zh-tw.json';
import ko from '../../messages/ko.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import pt from '../../messages/pt.json';

// Typed access to the message files for server code (page metadata) that
// runs outside react-i18next. Every locale has the same keys as ja.json.
export type Messages = typeof ja;

const messages: Record<AppLocale, Messages> = { en, ja, 'zh-cn': zhCn, 'zh-tw': zhTw, ko, es, fr, pt };

export function getMessages(locale: AppLocale): Messages {
  return messages[locale] ?? messages.en;
}
