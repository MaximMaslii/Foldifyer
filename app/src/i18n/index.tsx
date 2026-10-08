import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { STRINGS, type Strings } from "./strings";
import type { Lang } from "@/lib/types";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof Strings, vars?: Record<string, string | number>) => string };
const I18nCtx = createContext<Ctx | null>(null);
const KEY = "pp_lang";

export const deviceLang = (): Lang => { const l = getLocales()[0]?.languageCode; return l === "ru" || l === "de" ? l : "en"; };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang());
  useEffect(() => { AsyncStorage.getItem(KEY).then((v) => { if (v === "en" || v === "ru" || v === "de") setLangState(v); }).catch(() => {}); }, []);
  const setLang = useCallback((l: Lang) => { setLangState(l); AsyncStorage.setItem(KEY, l).catch(() => {}); }, []);
  const t = useCallback<Ctx["t"]>((k, vars) => {
    let s = STRINGS[lang][k] ?? STRINGS.en[k] ?? String(k);
    if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, String(v));
    return s;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error("I18nProvider missing");
  return c;
}

/** The words printed on the sheets, in the app's language. */
export function usePaperWords() {
  const { t } = useI18n();
  return useMemo(() => ({ head: t("pHead"), body: t("pBody"), leg: t("pLeg"), arm: t("pArm"), hand: t("pHand"), ear: t("pEar"), tail: t("pTail"), muzzle: t("pMuzzle"), foot: t("pFoot"), hair: t("pHair"), extra: t("pExtra"), cut: t("pCut"), fold: t("pFold"), glue: t("pGlue"), made: t("pMade"), house: t("pHouse"), roof: t("pRoof"), box: t("pBox") }), [t]);
}
