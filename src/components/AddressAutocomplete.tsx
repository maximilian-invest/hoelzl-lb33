'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchAddresses, validateAddress, type AddressSuggestion } from '@/lib/geocoding';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAddressSelect?: (address: AddressSuggestion) => void;
  onValidationChange?: (isValid: boolean, confidence: number) => void;
  showValidationStatus?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Adresse eingeben",
  className = "",
  onAddressSelect,
  onValidationChange,
  showValidationStatus = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    confidence: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const results = await searchAddresses(query, 5);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Fehler beim Laden der Adressvorschläge:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate current address
  const validateCurrentAddress = async (address: string) => {
    if (!address || address.length < 3) {
      setValidationStatus(null);
      if (onValidationChange) {
        onValidationChange(false, 0);
      }
      return;
    }

    try {
      const validation = await validateAddress(address);
      setValidationStatus(validation);
      if (onValidationChange) {
        onValidationChange(validation.isValid, validation.confidence);
      }
    } catch (error) {
      console.error('Fehler bei der Adressvalidierung:', error);
      setValidationStatus({ isValid: false, confidence: 0 });
      if (onValidationChange) {
        onValidationChange(false, 0);
      }
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for search
    debounceRef.current = setTimeout(() => {
      performSearch(newValue);
      validateCurrentAddress(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.formatted_address || suggestion.display_name);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    // Validate the selected address
    validateCurrentAddress(suggestion.formatted_address || suggestion.display_name);
    
    if (onAddressSelect) {
      onAddressSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Get validation status icon and color
  const getValidationStatus = () => {
    if (!showValidationStatus || !validationStatus) return null;
    
    if (validationStatus.isValid) {
      return {
        icon: '✓',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      };
    } else if (validationStatus.confidence > 0) {
      return {
        icon: '⚠',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      };
    } else {
      return {
        icon: '✗',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
      };
    }
  };

  const validationStatusInfo = getValidationStatus();

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${validationStatusInfo ? validationStatusInfo.bgColor : ''} ${className}`}
          autoComplete="off"
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {validationStatusInfo && validationStatus && (
            <span className={`text-sm ${validationStatusInfo.color}`} title={`Adressvalidierung: ${validationStatus.confidence}% Vertrauen`}>
              {validationStatusInfo.icon}
            </span>
          )}
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium">
                {suggestion.formatted_address || suggestion.display_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center justify-between">
                <span>{suggestion.display_name}</span>
                {suggestion.confidence && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {Math.round(suggestion.confidence)}% Vertrauen
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
