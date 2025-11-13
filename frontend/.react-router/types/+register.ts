import "react-router";

declare module "react-router" {
  interface Register {
    params: Params;
  }

  interface Future {
    unstable_middleware: false
  }
}

type Params = {
  "/": {};
  "/features": {};
  "/contact": {};
  "/login": {};
  "/dashboard": {};
  "/pricing": {};
  "/enterprise-contact": {};
  "/*": {
    "*": string;
  };
};