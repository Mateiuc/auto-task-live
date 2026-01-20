import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

export interface PhoneNumber {
  number: string;
  type: string;       // 'mobile', 'home', 'work', 'main', 'other', etc.
  isPrimary: boolean;
}

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumbers: PhoneNumber[];
  emails: string[];
}

export const contactsService = {
  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not running on native platform');
      return false;
    }

    try {
      const result = await Contacts.requestPermissions();
      return result.contacts === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await Contacts.checkPermissions();
      return result.contacts === 'granted';
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      return false;
    }
  },

  async getAllContacts(): Promise<PhoneContact[]> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return [];
        }
      }

      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true,
        }
      });

      return result.contacts.map((contact: any) => ({
        id: contact.contactId || Math.random().toString(),
        name: contact.name?.display || 'Unknown',
        phoneNumbers: contact.phones?.map((p: any) => ({
          number: p.number || '',
          type: (p.type || 'other').toLowerCase(),
          isPrimary: p.isPrimary || false,
        })) || [],
        emails: contact.emails?.map((e: any) => e.address || '') || [],
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  },

  searchContacts(contacts: PhoneContact[], query: string): PhoneContact[] {
    if (!query.trim()) return contacts;
    
    const lowercaseQuery = query.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(lowercaseQuery) ||
      contact.phoneNumbers.some(phone => phone.number.includes(query)) ||
      contact.emails.some(email => email.toLowerCase().includes(lowercaseQuery))
    );
  },

  getBestPhoneNumber(phones: PhoneNumber[]): string | null {
    if (!phones || phones.length === 0) return null;
    
    // Priority 1: isPrimary flag (user explicitly set as preferred)
    const primary = phones.find(p => p.isPrimary);
    if (primary) return primary.number;
    
    // Priority 2: Mobile type (most likely to reach person)
    const mobile = phones.find(p => p.type === 'mobile');
    if (mobile) return mobile.number;
    
    // Priority 3: Main type
    const main = phones.find(p => p.type === 'main');
    if (main) return main.number;
    
    // Priority 4: Work type
    const work = phones.find(p => p.type === 'work');
    if (work) return work.number;
    
    // Fallback: first number in list
    return phones[0]?.number || null;
  },

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for 10 digit numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Format as +X (XXX) XXX-XXXX for 11 digit numbers (with country code)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  }
};
