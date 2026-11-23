import { CreateAddressInput } from '@/generated/graphql';

export type ShippingFormData = CreateAddressInput;

export interface ActiveOrderContextType {
  activeOrder: any | null;
  adjustOrderLine: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  addItemToOrder: (variantId: string, quantity?: number) => void;
  removeAllItems: () => void;
  refresh: () => void;
  isLoading: boolean;
  error?: string;
}

export interface RootLayoutData {
  activeCustomer: any;
  activeChannel: any;
  collections: any[];
  locale: string;
}
