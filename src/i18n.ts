import { Language } from './types.js';
import { en, TranslationType } from './i18n/locales/en.js';
import { fa } from './i18n/locales/fa.js';
import { ar } from './i18n/locales/ar.js';
import { es } from './i18n/locales/es.js';
import { zh } from './i18n/locales/zh.js';
import { fr } from './i18n/locales/fr.js';
import { de } from './i18n/locales/de.js';
import { ru } from './i18n/locales/ru.js';
import { pt } from './i18n/locales/pt.js';
import { ja } from './i18n/locales/ja.js';
import { hi } from './i18n/locales/hi.js';
import { it } from './i18n/locales/it.js';
import { tr } from './i18n/locales/tr.js';
import { ko } from './i18n/locales/ko.js';
import { nl } from './i18n/locales/nl.js';
import { pl } from './i18n/locales/pl.js';
import { id } from './i18n/locales/id.js';
import { vi } from './i18n/locales/vi.js';
import { ur } from './i18n/locales/ur.js';
import { bn } from './i18n/locales/bn.js';

export { SUPPORTED_LANGUAGES, getLanguageInfo, isRtlLanguage } from './i18n/languages.js';
export type { TranslationType };

export const translations: Record<Language, TranslationType> = {
  en,
  fa,
  ar,
  es,
  zh,
  fr,
  de,
  ru,
  pt,
  ja,
  hi,
  it,
  tr,
  ko,
  nl,
  pl,
  id,
  vi,
  ur,
  bn,
};
