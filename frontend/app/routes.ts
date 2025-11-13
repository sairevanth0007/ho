import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // route("/about-us", "routes/about-us.tsx"), 
  route("/features", "routes/features.tsx"),
  route("/contact", "routes/contact.tsx"),
  route("/login", "routes/login.tsx"),
  route("/dashboard", "routes/dashboard.tsx"),
  route("/pricing", "routes/pricing.tsx"),
  route("/enterprise-contact", "routes/enterprise-contact.tsx"), 
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
