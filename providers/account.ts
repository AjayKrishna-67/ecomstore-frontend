import gql from 'graphql-tag';
import {
  CreateAddressInput,
  UpdateAddressInput,
  UpdateCustomerInput,
  RegisterCustomerAccountMutationVariables,
  AuthenticationInput,
  CurrentUser,
  ErrorResult,
} from '@/generated/graphql';
import { sdk, WithHeaders } from '@/lib/graphql-client';
import { API_URL, CHANNEL_TOKEN } from '@/lib/constants';
import { getAuthToken } from '@/lib/session';

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
) {
  const response = await sdk.login({ email, password, rememberMe });
  return {
    ...response.login,
    _headers: response._headers,
  };
}

export const logout = async () => {
  return sdk.logout({}).then((res) => ({
    ...res.logout,
    _headers: res._headers,
  }));
};

export const registerCustomerAccount = async (
  variables: RegisterCustomerAccountMutationVariables,
) => {
  return sdk.registerCustomerAccount(variables).then((res) => ({
    ...res.registerCustomerAccount,
    _headers: res._headers,
  }));
};

export const verifyCustomerAccount = async (
  token: string,
  password?: string,
) => {
  return sdk.verifyCustomerAccount({ token, password }).then((res) => ({
    ...res.verifyCustomerAccount,
    _headers: res._headers,
  }));
};

export async function updateCustomer(input: UpdateCustomerInput) {
  return sdk.updateCustomer({ input });
}

export async function requestUpdateCustomerEmailAddress(
  password: string,
  newEmailAddress: string,
) {
  return sdk
    .requestUpdateCustomerEmailAddress({ password, newEmailAddress })
    .then((res) => res.requestUpdateCustomerEmailAddress);
}

export async function updateCustomerEmailAddress(token: string) {
  return sdk
    .updateCustomerEmailAddress({ token })
    .then((res) => res.updateCustomerEmailAddress);
}

export async function updateCustomerAddress(input: UpdateAddressInput) {
  return sdk
    .updateCustomerAddress({ input })
    .then((res) => res.updateCustomerAddress);
}

export async function createCustomerAddress(input: CreateAddressInput) {
  return sdk
    .createCustomerAddress({ input })
    .then((res) => res.createCustomerAddress);
}

export async function deleteCustomerAddress(id: string) {
  return sdk
    .deleteCustomerAddress({ id })
    .then((res) => res.deleteCustomerAddress);
}

export async function updateCustomerPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return sdk
    .updateCustomerPassword(input)
    .then((res) => res.updateCustomerPassword);
}

export async function requestAccountDeletion(
  reason: string,
): Promise<{ success: boolean; message: string }> {
  const authToken = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'vendure-token': CHANNEL_TOKEN,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: `
          mutation requestAccountDeletion($reason: String) {
            requestAccountDeletion(reason: $reason) {
              success
              message
            }
          }
        `,
        variables: { reason },
      }),
    });

    if (!response.ok) {
      return { success: false, message: `Request failed: HTTP ${response.status}` };
    }

    const json = (await response.json()) as {
      data?: { requestAccountDeletion: { success: boolean; message: string } };
      errors?: Array<{ message: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      return { success: false, message: json.errors[0].message };
    }

    if (!json.data?.requestAccountDeletion) {
      return { success: false, message: 'No response received' };
    }

    return json.data.requestAccountDeletion;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function authenticate(
  input: AuthenticationInput,
  customHeaders: Record<string, string>,
): Promise<{ result: CurrentUser | ErrorResult; headers: Headers }> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify({
        query: `
          mutation Authenticate($input: AuthenticationInput!) {
            authenticate(input: $input) {
              __typename
              ... on CurrentUser {
                id
                identifier
                channels {
                  id
                  code
                  token
                  permissions
                }
              }
              ... on InvalidCredentialsError {
                message
                errorCode
              }
              ... on NotVerifiedError {
                message
                errorCode
              }
            }
          }
        `,
        variables: { input },
      }),
    });

    if (!response.ok) {
      return {
        result: {
          __typename: 'InvalidCredentialsError',
          message: `Authentication failed: HTTP ${response.status}`,
          errorCode: 'INVALID_CREDENTIALS_ERROR',
        } as ErrorResult,
        headers: response.headers,
      };
    }

    const json = (await response.json()) as {
      data?: { authenticate: CurrentUser | ErrorResult };
      errors?: Array<{ message: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      return {
        result: {
          __typename: 'InvalidCredentialsError',
          message: json.errors[0].message,
          errorCode: 'INVALID_CREDENTIALS_ERROR',
        } as ErrorResult,
        headers: response.headers,
      };
    }

    if (!json.data || !json.data.authenticate) {
      return {
        result: {
          __typename: 'InvalidCredentialsError',
          message: 'Authentication failed: No data received',
          errorCode: 'INVALID_CREDENTIALS_ERROR',
        } as ErrorResult,
        headers: response.headers,
      };
    }

    return {
      result: json.data.authenticate,
      headers: response.headers,
    };
  } catch (error) {
    return {
      result: {
        __typename: 'InvalidCredentialsError',
        message: error instanceof Error ? error.message : 'Network error',
        errorCode: 'INVALID_CREDENTIALS_ERROR',
      } as ErrorResult,
      headers: new Headers(),
    };
  }
}

// GraphQL mutations
gql`
  mutation login($email: String!, $password: String!, $rememberMe: Boolean) {
    login(username: $email, password: $password, rememberMe: $rememberMe) {
      __typename
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
  mutation logout {
    logout {
      success
    }
  }
`;

gql`
  mutation registerCustomerAccount($input: RegisterCustomerInput!) {
    registerCustomerAccount(input: $input) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation verifyCustomerAccount($token: String!, $password: String) {
    verifyCustomerAccount(token: $token, password: $password) {
      __typename
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
  mutation updateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      __typename
    }
  }
`;

gql`
  mutation requestUpdateCustomerEmailAddress(
    $password: String!
    $newEmailAddress: String!
  ) {
    requestUpdateCustomerEmailAddress(
      password: $password
      newEmailAddress: $newEmailAddress
    ) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation updateCustomerEmailAddress($token: String!) {
    updateCustomerEmailAddress(token: $token) {
      __typename
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation updateCustomerAddress($input: UpdateAddressInput!) {
    updateCustomerAddress(input: $input) {
      __typename
    }
  }
`;

gql`
  mutation createCustomerAddress($input: CreateAddressInput!) {
    createCustomerAddress(input: $input) {
      __typename
    }
  }
`;

gql`
  mutation deleteCustomerAddress($id: ID!) {
    deleteCustomerAddress(id: $id) {
      success
    }
  }
`;

gql`
  mutation updateCustomerPassword(
    $currentPassword: String!
    $newPassword: String!
  ) {
    updateCustomerPassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      __typename
      ... on Success {
        success
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;
