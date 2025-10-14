import { stackServerApp } from "@/stack/server";
import { StackHandler } from "@stackframe/stack";

const handler = StackHandler({
  app: stackServerApp,
  fullPage: false,
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
