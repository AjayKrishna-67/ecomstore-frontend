import gql from 'graphql-tag';
import { sdk } from '@/lib/graphql-client';
import { PaymentInput } from '@/generated/graphql';

export function getAvailableCountries() {
  return sdk.availableCountries({});
}

export function getEligibleShippingMethods() {
  return sdk.eligibleShippingMethods({});
}

export function getEligiblePaymentMethods() {
  return sdk.eligiblePaymentMethods({});
}

export function getNextOrderStates() {
  return sdk.nextOrderStates({});
}

export function addPaymentToOrder(input: PaymentInput) {
  return sdk.addPaymentToOrder({ input });
}

export function transitionOrderToState(state: string) {
  return sdk.transitionOrderToState({ state });
}

gql`
  query eligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      description
      metadata
      price
      priceWithTax
    }
  }
`;

gql`
  query eligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      code
      name
      description
      eligibilityMessage
      isEligible
    }
  }
`;

gql`
  query nextOrderStates {
    nextOrderStates
  }
`;

gql`
  query availableCountries {
    availableCountries {
      id
      name
      code
    }
  }
`;

gql`
  mutation transitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      ... on Order {
        id
        code
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;
