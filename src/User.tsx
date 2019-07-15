import React, { useContext } from 'react';
import { AppContext } from './App';
import styled from 'styled-components';
import { StyledButton } from './Button';

const StyledUserName = styled.a`
  font-weight: bold;
`;

const StyledUser = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 3rem;
  grid-column-gap: 1rem;
  grid-template-rows: 50% 50%;
  grid-template-areas:
    'name avatar'
    'details avatar';
  padding: 0.5rem;

  &:not([data-state~='auth.authorized']) {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  > ${StyledUserName} {
    justify-self: end;
  }

  > figure {
    margin: 0;
    grid-area: avatar;
  }
`;

const StyledImg = styled.img`
  height: 100%;
  border-radius: 0.5rem;
  background: gray;
`;

export const User: React.FunctionComponent = () => {
  const { state, send } = useContext(AppContext);

  const {
    context: { user }
  } = state;

  console.log(state);

  return (
    <div>
      <StyledUser data-state={state.toStrings().join(' ')}>
        {state.matches({ auth: 'unauthorized' }) ? (
          <StyledButton data-variant="link" onClick={() => send('LOGIN')}>
            Login
          </StyledButton>
        ) : !state.matches({ auth: 'authorized' }) ? (
          <div>
            Authorizing...{' '}
            <StyledButton
              data-variant="link"
              onClick={() => send('AUTH.CANCEL')}
            >
              Cancel
            </StyledButton>
          </div>
        ) : (
          <>
            <StyledUserName>
              {user ? user.login : <em>Anonymous</em>}
            </StyledUserName>
            <StyledButton data-variant="link" onClick={() => send('LOGOUT')}>
              Log out
            </StyledButton>
            <figure>
              {user ? (
                <StyledImg src={user.avatar_url} />
              ) : (
                <StyledImg as="div" />
              )}
            </figure>
          </>
        )}
      </StyledUser>
    </div>
  );
};
