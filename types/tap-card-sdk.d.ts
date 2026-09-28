// The slice of Tap's Card SDK v2 (window.CardSDK) this app uses.
// https://developers.tap.company/docs/card-sdk-web-v2

export type TapToken = {
  id: string;
  card?: { brand?: string; last_four?: string; scheme?: string };
};

export type TapCardConfig = {
  publicKey: string;
  merchant?: { id: string };
  transaction: { amount: number; currency: string };
  customer?: {
    name?: { lang: string; first: string; last?: string }[];
    nameOnCard?: string;
    editable?: boolean;
    contact?: { email?: string };
  };
  acceptance?: { supportedBrands?: string[]; supportedCards?: "ALL" | string[] };
  fields?: { cardHolder?: boolean };
  addons?: { displayPaymentBrands?: boolean; loader?: boolean; saveCard?: boolean };
  interface?: { locale?: string; theme?: string; edges?: string; direction?: string };
  onReady?: () => void;
  onValidInput?: (data: unknown) => void;
  onInvalidInput?: (data: unknown) => void;
  onError?: (data: unknown) => void;
  onSuccess?: (token: TapToken) => void;
};

export type TapCardSDK = {
  renderTapCard: (elementId: string, config: TapCardConfig) => { unmount: () => void };
  tokenize: () => void;
  Theme: { LIGHT: string; DARK: string };
  Currencies: Record<string, string>;
  Direction: { LTR: string; RTL: string };
  Edges: { CURVED: string; STRAIGHT: string };
  Locale: { EN: string; AR: string };
};

declare global {
  interface Window {
    CardSDK?: TapCardSDK;
  }
}
