import gql from 'graphql-tag';
import { sdk, WithHeaders } from '@/lib/graphql-client';
import { authenticate } from './account';
import { API_URL, CHANNEL_TOKEN } from '@/lib/constants';
import type { CurrentUser, ErrorResult } from '@/generated/graphql';

export async function getChannelList() {
  return sdk.getChannelList().then((res) => {
    const allChannels = res.getChannelList;
    const allowedCities = ['Madurai', 'Coimbatore', 'Trichy', 'Salem'];
    const filteredChannels = allChannels.filter(
      (channel) =>
        channel.code !== '__default_channel__' &&
        allowedCities.includes(channel.code),
    );
    return Object.assign([...filteredChannels], { _headers: res._headers });
  });
}

export async function getChannelsByCustomerEmail(email: string) {
  const response = await sdk.GetChannelsByCustomerEmail({ email });
  return Object.assign([...response.getChannelsByCustomerEmail], {
    _headers: response._headers,
  });
}

export async function requestPasswordReset(email: string) {
  const response = await sdk.RequestPasswordReset({ email });
  const { requestPasswordReset, _headers } = response;
  if (!requestPasswordReset) {
    return { __typename: 'NativeAuthStrategyError', _headers } as any;
  }
  return { ...requestPasswordReset, _headers };
}

export async function resetPassword(token: string, password: string) {
  const response = await sdk.ResetPassword({ token, password });
  const { resetPassword, _headers } = response;
  if (!resetPassword) {
    return { __typename: 'PasswordResetTokenInvalidError', _headers };
  }
  return { ...resetPassword, _headers };
}

export async function sendPhoneOtp(phoneNumber: string): Promise<string | false> {
  try {
    const response = await sdk.SendPhoneOtp({ phoneNumber });
    return response.sendPhoneOtp || false;
  } catch {
    return false;
  }
}

export async function resendPhoneOtp(phoneNumber: string): Promise<string | false> {
  try {
    const response = await sdk.resendPhoneOtp({ phoneNumber });
    return response.resendPhoneOtp || false;
  } catch {
    return false;
  }
}

export async function checkUniquePhone(phone: string) {
  const response = await sdk.CheckUniquePhone({ phoneNumber: phone });
  return Object.assign(response.checkUniquePhone, {
    _headers: response._headers,
  });
}

export async function getCustomBanners(channelToken?: string) {
  try {
    const customHeaders: Record<string, string> = {};
    if (channelToken) {
      customHeaders['vendure-token'] = channelToken;
    }
    const response = await sdk.customBanners({}, { customHeaders });
    return { data: response.customBanners, headers: response._headers };
  } catch {
    return false;
  }
}

export async function getRazorpayOrderId(
  orderId: number | string,
  channelToken?: string,
) {
  try {
    const customHeaders: Record<string, string> = {};
    if (channelToken) {
      customHeaders['vendure-token'] = channelToken;
    }
    const response = await sdk.generateRazorpayOrderId(
      { orderId: String(orderId) },
      { customHeaders },
    );
    const result = response.generateRazorpayOrderId as any;
    if (result?.success) {
      return {
        amount: result.amount,
        currency: result.currency,
        keyId: result.keyId,
        razorpayOrderId: result.razorpayOrderId,
        success: result.success,
        headers: response._headers,
      };
    }
    return {
      errorMessage: result?.errorMessage ?? 'Unknown error',
      success: result?.success ?? false,
      headers: response._headers,
    };
  } catch {
    return false;
  }
}

export async function requestOrderCancellation(orderId: string, reason: string) {
  const response = await (sdk as any).RequestOrderCancellation(
    { orderId, reason },
  );
  return Object.assign(response.requestOrderCancellation, {
    _headers: response._headers,
  });
}

export async function otherInstructions(orderId: string, value: string) {
  const response = await sdk.OtherInstructions({ orderId, value });
  return Object.assign(response.otherInstructions, {
    _headers: response._headers,
  });
}

export async function toggleFavorite(productId: string) {
  const response = await sdk.ToggleFavorite({ productId });
  return Object.assign(response.toggleFavorite, {
    _headers: response._headers,
  });
}

export async function applyLoyaltyPoints(amount: number) {
  const response = await sdk.ApplyLoyaltyPoints({ amount });
  return Object.assign(response.applyLoyaltyPointsToActiveOrder, {
    _headers: response._headers,
  });
}

export async function removeLoyaltyPoints() {
  const response = await sdk.RemoveLoyaltyPointsFromActiveOrder();
  const { removeLoyaltyPointsFromActiveOrder, _headers } = response;
  if (!removeLoyaltyPointsFromActiveOrder) {
    return {
      __typename: 'Error',
      message: 'removeLoyaltyPointsFromActiveOrder returned null',
      _headers,
    };
  }
  return { ...removeLoyaltyPointsFromActiveOrder, _headers };
}

export async function getLoyaltyPointsConfig() {
  const response = await sdk.LoyaltyPointsConfig();
  if (!response?.loyaltyPointsConfig) return undefined;
  return { ...response.loyaltyPointsConfig, _headers: response._headers };
}

export async function getFrequentlyOrderedProducts() {
  const response = await sdk.GetFrequentlyOrderedProducts();
  return Object.assign([...response.frequentlyOrderedProducts], {
    _headers: response._headers,
  });
}

export async function authenticateWithGoogle(
  token: string,
  anonymousAuthToken?: string,
): Promise<{ result: CurrentUser | ErrorResult; headers: Headers }> {
  const customHeaders: Record<string, string> = {
    'vendure-token': CHANNEL_TOKEN,
  };
  if (anonymousAuthToken) {
    customHeaders['Authorization'] = `Bearer ${anonymousAuthToken}`;
  }

  return authenticate({ google: { token } }, customHeaders);
}

export async function getAvailableChannels(postalCode: string) {
  const response = await (sdk as any).GetAvailableChannels({ postalCode });
  const allChannels = response.getAvailableChannels || [];
  const swadKeralaChannel = allChannels.filter(
    (channel: any) =>
      channel.token === CHANNEL_TOKEN ||
      channel.token?.toLowerCase() === CHANNEL_TOKEN.toLowerCase(),
  );
  return Object.assign([...swadKeralaChannel], {
    _headers: response._headers,
  });
}

gql`
  query getChannelList {
    getChannelList {
      id
      code
      token
      customFields {
        enabled
      }
    }
  }
`;

gql`
  query GetChannelsByCustomerEmail($email: String!) {
    getChannelsByCustomerEmail(email: $email) {
      id
      code
      name
      token
    }
  }
`;

gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(emailAddress: $email) {
      ... on Success {
        success
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation SendPhoneOtp($phoneNumber: String!) {
    sendPhoneOtp(phoneNumber: $phoneNumber)
  }
`;

gql`
  mutation resendPhoneOtp($phoneNumber: String!) {
    resendPhoneOtp(phoneNumber: $phoneNumber)
  }
`;

gql`
  query CheckUniquePhone($phoneNumber: String!) {
    checkUniquePhone(phone: $phoneNumber)
  }
`;

gql`
  query customBanners {
    customBanners {
      id
      assets {
        id
        preview
        source
      }
    }
  }
`;

gql`
  mutation generateRazorpayOrderId($orderId: ID!) {
    generateRazorpayOrderId(orderId: $orderId) {
      success
      razorpayOrderId
      amount
      currency
      keyId
      errorMessage
    }
  }
`;

gql`
  mutation RequestOrderCancellation($orderId: ID!, $reason: String!) {
    requestOrderCancellation(orderId: $orderId, reason: $reason) {
      id
      code
      state
    }
  }
`;

gql`
  mutation OtherInstructions($orderId: ID!, $value: String!) {
    otherInstructions(orderId: $orderId, value: $value) {
      id
      customFields {
        otherInstructions
      }
    }
  }
`;

gql`
  mutation ToggleFavorite($productId: ID!) {
    toggleFavorite(productId: $productId) {
      items {
        id
        product {
          id
          name
          slug
        }
      }
      totalItems
    }
  }
`;

gql`
  mutation ApplyLoyaltyPoints($amount: Int!) {
    applyLoyaltyPointsToActiveOrder(amount: $amount) {
      id
      totalWithTax
      customFields {
        loyaltyPointsUsed
        loyaltyPointsEarned
      }
    }
  }
`;

gql`
  mutation RemoveLoyaltyPointsFromActiveOrder {
    removeLoyaltyPointsFromActiveOrder {
      id
      totalWithTax
      customFields {
        loyaltyPointsUsed
        loyaltyPointsEarned
      }
    }
  }
`;

gql`
  query LoyaltyPointsConfig {
    loyaltyPointsConfig {
      id
      pointsPerRupee
      rupeesPerPoint
    }
  }
`;

gql`
  query GetFrequentlyOrderedProducts {
    frequentlyOrderedProducts {
      orderCount
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
        }
      }
    }
  }
`;

gql`
  query GetAvailableChannels($postalCode: String) {
    getAvailableChannels(postalCode: $postalCode) {
      id
      code
      name
      token
      isAvailable
      message
    }
  }
`;
