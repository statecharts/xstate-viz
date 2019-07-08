import React, { useContext } from 'react';
import { AppContext } from './App';
import styled from 'styled-components';

const StyledUser = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 3rem;
  grid-template-rows: 50% 50%;
  grid-template-areas:
    'name avatar'
    'details avatar';
  padding: 0.5rem 0;

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

  return (
    <div>
      {!state.matches({ auth: 'authorized' }) ? (
        <button onClick={() => send('LOGIN')}>Login</button>
      ) : state.matches({ auth: { authorized: { user: 'loaded' } } }) ? (
        <StyledUser>
          <div>{user!.login}</div>
          <figure>
            <img src={user!.avatar_url} />
          </figure>
        </StyledUser>
      ) : (
        <div>loading user</div>
      )}
    </div>
  );
};
