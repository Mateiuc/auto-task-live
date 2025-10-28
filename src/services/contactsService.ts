import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumbers: string[];
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
        phoneNumbers: contact.phones?.map(p => p.number || '') || [],
        emails: contact.emails?.map(e => e.address || '') || [],
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
      contact.phoneNumbers.some(phone => phone.includes(query)) ||
      contact.emails.some(email => email.toLowerCase().includes(lowercaseQuery))
    );
  },

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for 10 digit numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }
};
