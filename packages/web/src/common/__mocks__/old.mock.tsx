import React, { FC, ReactElement } from "react";
import { Provider } from "react-redux";
import { configureStore, PreloadedState } from "@reduxjs/toolkit";
import { render, RenderOptions } from "@testing-library/react";
import { reducers } from "@web/store/reducers";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// function render(
//   ui: JSX.Element,
//   {
//     preloadedState,
//     store = configureStore({ reducer: reducers, preloadedState }),
//     ...renderOptions
//   } = {}
// ) {

// const store = configureStore({ reducer: reducers, preloadedState });
interface Props {
  children: React.ReactNode;
  preloadedState: PreloadedState;
}

const AllTheProviders: FC<Props> = ({ children }) => {
  // const container = document.getElementById("root");
  // const root = createRoot(container);
  //   const preloadedState: PreloadedState = {};
  //   const store = configureStore({ reducer: reducers, preloadedState });
  const store = configureStore({ reducer: reducers, preloadedState });

  return (
    <DndProvider backend={HTML5Backend}>
      <Provider store={store}>{children}</Provider>;
    </DndProvider>
  );
};

const customRender = (
  ui: ReactElement,
  preloadedState,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, preloadedState, ...options });

// re-export everything
export * from "@testing-library/react";
// override render method
export { customRender as render };
