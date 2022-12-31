import * as React from 'react';
import styled from 'styled-components/macro';
import { LoadingIndicator } from '../LoadingIndicator';

export const FallbackLoader = () => (
  <LoadingWrapper>
    <LoadingIndicator />
  </LoadingWrapper>
);

const LoadingWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
