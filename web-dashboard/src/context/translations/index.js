// AgriGuard Multilingual Translations Index (12 Supported Indian Languages)
import { en } from "./en";
import { ta } from "./ta";
import { hi } from "./hi";
import { te } from "./te";
import { kn } from "./kn";
import { ml } from "./ml";
import { bn } from "./bn";
import { mr } from "./mr";
import { gu } from "./gu";
import { pa } from "./pa";
import { or } from "./or";
import { as } from "./as";

import { extendedTranslations } from "./extended";
import { authAndRegistryTranslations } from "./authAndRegistry";

export const TRANSLATIONS = {
  en: { ...en, ...(extendedTranslations.en || {}), ...(authAndRegistryTranslations.en || {}) },
  ta: { ...ta, ...(extendedTranslations.ta || {}), ...(authAndRegistryTranslations.ta || {}) },
  hi: { ...hi, ...(extendedTranslations.hi || {}), ...(authAndRegistryTranslations.hi || {}) },
  te: { ...te, ...(extendedTranslations.te || {}), ...(authAndRegistryTranslations.te || {}) },
  kn: { ...kn, ...(extendedTranslations.kn || {}), ...(authAndRegistryTranslations.kn || {}) },
  ml: { ...ml, ...(extendedTranslations.ml || {}), ...(authAndRegistryTranslations.ml || {}) },
  bn: { ...bn, ...(extendedTranslations.bn || {}), ...(authAndRegistryTranslations.bn || {}) },
  mr: { ...mr, ...(extendedTranslations.mr || {}), ...(authAndRegistryTranslations.mr || {}) },
  gu: { ...gu, ...(extendedTranslations.gu || {}), ...(authAndRegistryTranslations.gu || {}) },
  pa: { ...pa, ...(extendedTranslations.pa || {}), ...(authAndRegistryTranslations.pa || {}) },
  or: { ...or, ...(extendedTranslations.or || {}), ...(authAndRegistryTranslations.or || {}) },
  as: { ...as, ...(extendedTranslations.as || {}), ...(authAndRegistryTranslations.as || {}) }
};

export { en, ta, hi, te, kn, ml, bn, mr, gu, pa, or, as };

