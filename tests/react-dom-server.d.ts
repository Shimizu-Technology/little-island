/** Test-only signature for the one server renderer API used by the map contract test. */
declare module "react-dom/server" {
  export function renderToStaticMarkup(element: import("react").ReactNode): string;
}
