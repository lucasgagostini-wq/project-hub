import React from "react";

export const MobileCtx = React.createContext(false);
export const useMobile = () => React.useContext(MobileCtx);
