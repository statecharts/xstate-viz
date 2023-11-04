import React from 'react'
import styled from 'styled-components'
import { Header } from './Header'

const StyledApp = styled.main`
  --color-app-background: #fff;
  --color-border: #c9c9c9;
  --color-primary: rgba(87, 176, 234, 1);
  --color-primary-faded: rgba(87, 176, 234, 0.5);
  --color-primary-shadow: rgba(87, 176, 234, 0.1);
  --color-link: rgba(87, 176, 234, 1);
  --color-disabled: #b3b3b3;
  --color-edge: #c9c9c9;
  --color-edge-active: var(--color-primary);
  --color-secondary: rgba(255, 152, 0, 1);
  --color-secondary-light: rgba(255, 152, 0, 0.5);
  --color-sidebar: #272722;
  --color-gray: #555;
  --color-failure: #ee7170;
  --color-success: #31ae00;
  --radius: 0.2rem;
  --border-width: 2px;
  --sidebar-width: 25rem;
  --shadow: 0 0.5rem 1rem var(--shadow-color, rgba(0, 0, 0, 0.2));
  --duration: 0.2s;
  --easing: cubic-bezier(0.5, 0, 0.5, 1);

  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const DeprecationNotice = styled.div`
  font-size: 1.25rem;
  align-self: center;
  max-width: 60ch;
  background-color: #fcfcfc;
  border: 1px solid #bababa;
  overflow: hidden;
  border-radius: 6px;
  line-height: 1.5;

  & > div {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem;
  }

  p {
    margin: 0;
  }

  img {
    max-width: 100%;
  }

  a[href^="https://state.new/"]
  {
    font-weight: bold;
    color: #cf249b;
  }

  a[data-variant='button'] {
    display: inline;
    background-color: #cf249b;
    color: #fff;
    padding: 0.5rem 0.25rem;
    border-radius: 3px;
    text-decoration: none;
    text-align: center;
  }

  a[data-variant='small'] {
    font-size: 1rem;
  }
`

export function App() {
  return (
    <StyledApp>
      <Header />

      <DeprecationNotice>
        <img src="/screenshot.png" />

        <div>
          <p>This viz is deprecated and no longer maintained!</p>
          <p>
            Use our new <a href="https://state.new/">Stately Studio</a> to build
            and visualize state machines with drag-and-drop, AI assistance,
            exporting to XState V5, & more.
          </p>
          <a href="https://stately.ai/" data-variant="button">
            Check out Stately, the visual tooling behind XState
          </a>
          <a href="https://stately.ai/docs/visualizer" data-variant="small">
            More information on the legacy and new visualizer.
          </a>
        </div>
      </DeprecationNotice>
    </StyledApp>
  )

  // return (
  //   <StyledApp data-layout={layout} data-embed={query.embed}>
  //     <Notifications notifier={notificationsActor} />
  //     <AppContext.Provider value={{ state: current, send, service }}>
  //       <StyledBanner>
  //         <a href="https://stately.ai/viz" target="_blank">
  //           Try out the new Stately Visualizer
  //         </a>
  //       </StyledBanner>
  //       <User />
  //       <Header />
  //       {current.matches({ gist: 'fetching' }) ? (
  //         <Loader />
  //       ) : (
  //         <>
  //           <StateChart
  //             machine={current.context.machine}
  //             onSave={(code) => {
  //               send('GIST.SAVE', { code })
  //             }}
  //           />
  //           <LayoutButton onClick={() => dispatchLayout('TOGGLE')}>
  //             {({ full: 'Hide', viz: 'Code' } as Record<string, string>)[
  //               layout
  //             ] || 'Show'}
  //           </LayoutButton>
  //         </>
  //       )}
  //     </AppContext.Provider>
  //   </StyledApp>
  // )
}
