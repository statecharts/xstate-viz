import React, { useContext } from 'react';
import { AppContext } from './App';
import styled from 'styled-components';

const StyledUser = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: 3rem 1fr;
  grid-template-rows: 50% 50%;
  grid-template-areas: 'avatar name' 'avatar details';
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
      {!state.matches('authorized') ? (
        <button onClick={() => send('LOGIN')}>Loginnn</button>
      ) : state.matches({ authorized: { user: 'loaded' } }) ? (
        <StyledUser>
          <figure>
            <img src={user!.avatar_url} />
          </figure>
          <div>{user!.login}</div>
        </StyledUser>
      ) : (
        <div>loading user</div>
      )}
    </div>
  );
};
