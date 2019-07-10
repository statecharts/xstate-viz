import React, { useContext } from 'react';
import { AppContext } from './App';
import styled from 'styled-components';

const StyledUserName = styled.a`
  font-weight: bold;
`;
const StyledUserActions = styled.div``;

const StyledUser = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 3rem;
  grid-column-gap: 1rem;
  grid-template-rows: 50% 50%;
  grid-template-areas:
    'name avatar'
    'details avatar';
  padding: 0.5rem 0;

  > ${StyledUserName}, > ${StyledUserActions} {
    justify-self: end;
  }

  > figure {
    margin: 0;
    grid-area: avatar;

    > img {
      height: 100%;
      border-radius: 0.5rem;
    }
  }
`;

export const User: React.FunctionComponent = () => {
  const { state, send } = useContext(AppContext);

  const {
    context: { user }
  } = state;

  console.log(state);

  return (
    <div>
      {!state.matches({ auth: 'authorized' }) ? (
        <button onClick={() => send('LOGIN')}>Login</button>
      ) : (
        <StyledUser>
          <StyledUserName>{user!.login}</StyledUserName>
          <StyledUserActions>
            <button onClick={() => send('LOGOUT')}>Log out</button>
          </StyledUserActions>
          <figure>
            <img src={user!.avatar_url} />
          </figure>
        </StyledUser>
      )}
    </div>
  );
};
