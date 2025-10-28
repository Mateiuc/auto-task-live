import { useState, useEffect, useRef } from 'react';
import { Check, User, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { contactsService, PhoneContact } from '@/services/contactsService';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface ContactComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  clients: Client[];
  onContactSelect?: (contact: PhoneContact) => void;
  onPendingNameChange?: (name: string) => void;
}

export const ContactCombobox = ({ 
  value, 
  onValueChange, 
  clients,
  onContactSelect,
  onPendingNameChange
}: ContactComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const phoneContacts = await contactsService.getAllContacts();
      setContacts(phoneContacts);
    } catch (error) {
      toast({
        title: 'Contact Access Error',
        description: 'Could not load contacts. Please grant permission.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contactsService.searchContacts(contacts, searchQuery);
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSelect = (contact: PhoneContact) => {
    const existingClient = clients.find(c => 
      c.name.toLowerCase() === contact.name.toLowerCase()
    );

    if (existingClient) {
      onValueChange(existingClient.id);
      setSearchQuery(existingClient.name);
      toast({
        title: 'Client Found',
        description: `${existingClient.name} already exists`,
      });
    } else {
      onContactSelect?.(contact);
      setSearchQuery(contact.name);
    }
    
    setOpen(false);
    setIsFocused(false);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSearchQuery(client.name);
    }
    onValueChange(clientId);
    setOpen(false);
    setIsFocused(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    onValueChange('');
    inputRef.current?.focus();
  };

  const showDropdown = (isFocused || open) && (searchQuery.length > 0 || isLoading);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center justify-center">
        <Input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => {
            const newValue = e.target.value;
            setSearchQuery(newValue);
            setOpen(true);
            // Pass pending name for free text input
            if (newValue && onPendingNameChange) {
              onPendingNameChange(newValue);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            if (searchQuery) setOpen(true);
          }}
          placeholder="Search or type client name..."
          className="pr-8 text-center"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading contacts...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No contacts or clients found.</CommandEmpty>
                  
                  {filteredClients.length > 0 && (
                    <CommandGroup heading="Existing Clients">
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => handleClientSelect(client.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <User className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{client.name}</span>
                            {client.phone && (
                              <span className="text-xs text-muted-foreground">{client.phone}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {filteredContacts.length > 0 && (
                    <CommandGroup heading="Phone Contacts">
                      {filteredContacts.slice(0, 10).map((contact) => (
                        <CommandItem
                          key={contact.id}
                          value={contact.id}
                          onSelect={() => handleContactSelect(contact)}
                        >
                          <User className="mr-2 h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span>{contact.name}</span>
                            {contact.phoneNumbers[0] && (
                              <span className="text-xs text-muted-foreground">
                                {contactsService.formatPhoneNumber(contact.phoneNumbers[0])}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
