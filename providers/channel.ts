import gql from 'graphql-tag';
import { sdk } from '@/lib/graphql-client';

export function activeChannel() {
  return sdk
    .activeChannel()
    .then(({ activeChannel }) =>
      activeChannel.id == '5' ? activeChannel : null,
    );
}

gql`
  query activeChannel {
    activeChannel {
      id
      currencyCode
    }
  }
`;
