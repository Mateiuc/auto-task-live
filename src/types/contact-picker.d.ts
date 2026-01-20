// Contact Picker API TypeScript declarations
// https://developer.mozilla.org/en-US/docs/Web/API/Contact_Picker_API

interface ContactAddress {
  city?: string;
  country?: string;
  dependentLocality?: string;
  organization?: string;
  phone?: string;
  postalCode?: string;
  recipient?: string;
  region?: string;
  sortingCode?: string;
  addressLine?: string[];
}

interface ContactInfo {
  address?: ContactAddress[];
  email?: string[];
  icon?: Blob[];
  name?: string[];
  tel?: string[];
}

interface ContactsSelectOptions {
  multiple?: boolean;
}

interface ContactsManager {
  getProperties(): Promise<string[]>;
  select(properties: string[], options?: ContactsSelectOptions): Promise<ContactInfo[]>;
}

interface Navigator {
  contacts?: ContactsManager;
}

interface Window {
  ContactsManager?: typeof ContactsManager;
}
