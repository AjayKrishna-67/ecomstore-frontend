import gql from 'graphql-tag';
import { sdk } from '@/lib/graphql-client';
import { OrderListOptions } from '@/generated/graphql';

export function getActiveCustomer() {
  return sdk.activeCustomer();
}

export function getActiveCustomerDetails() {
  return sdk.activeCustomerDetails();
}

export function getActiveCustomerAddresses() {
  return sdk.activeCustomerAddresses();
}

export function getActiveCustomerOrderList(orderListOptions: OrderListOptions) {
  return sdk.activeCustomerOrderList({ orderListOptions });
}

gql`
  query activeCustomer($options: LoyaltyPointsTransactionListOptions) {
    activeCustomer {
      id
      firstName
      lastName
      groups {
        id
        name
      }
      favorites {
        totalItems
        items {
          id
          product {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
            variants {
              id
              name
              priceWithTax
              currencyCode
              stockLevel
              sku
            }
          }
        }
      }
      customFields {
        loyaltyPointsAvailable
      }
      loyaltyPointsTransactions(options: $options) {
        items {
          id
          createdAt
          updatedAt
          note
          value
          order {
            id
            code
            orderPlacedAt
            state
          }
          __typename
        }
        totalItems
      }
    }
  }
`;

gql`
  query activeCustomerDetails {
    activeCustomer {
      id
      title
      firstName
      lastName
      phoneNumber
      emailAddress
      createdAt
      groups {
        id
        name
      }
      referredBy {
        id
        referrer {
          id
          firstName
          lastName
        }
        status
        points
        createdAt
      }
    }
  }
`;

gql`
  query activeCustomerAddresses {
    activeCustomer {
      id
      addresses {
        id
        company
        fullName
        streetLine1
        streetLine2
        city
        province
        postalCode
        country {
          id
          code
          name
        }
        phoneNumber
        defaultShippingAddress
        defaultBillingAddress
      }
    }
  }
`;

gql`
  query activeCustomerOrderList($orderListOptions: OrderListOptions) {
    activeCustomer {
      id
      firstName
      emailAddress
      favorites {
        totalItems
        items {
          id
          product {
            id
            name
            slug
            featuredAsset {
              id
              preview
            }
            variants {
              id
              name
              priceWithTax
              currencyCode
              stockLevel
              sku
            }
          }
        }
      }
      orders(options: $orderListOptions) {
        totalItems
        items {
          id
          code
          state
          orderPlacedAt
          currencyCode
          subTotal
          subTotalWithTax
          total
          totalWithTax
          shippingWithTax
          shippingLines {
            priceWithTax
          }
          taxSummary {
            taxBase
            taxTotal
          }
          discounts {
            amountWithTax
          }
          fulfillments {
            trackingCode
          }
          customFields {
            otherInstructions
          }
          lines {
            quantity
            discountedLinePriceWithTax
            discountedUnitPriceWithTax
            fulfillmentLines {
              quantity
              fulfillment {
                state
                updatedAt
              }
            }
            featuredAsset {
              name
              source
              preview
            }
            productVariant {
              name
              sku
              currencyCode
              priceWithTax
              product {
                slug
              }
            }
          }
        }
      }
    }
  }
`;
