import { setupServer } from "msw/node";

export { http } from "msw";

export const server = setupServer();
