import { legacy_createStore as createStore } from "redux";

const initialState = {
  sidebarUnfoldable: false,
  theme: "light",
};

const reducer = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case "set":
      return { ...state, ...rest };
    default:
      return state;
  }
};

const store = createStore(reducer);

export default store;
