import { app } from '../../../server/index';

export const fallback = ({ request }: { request: Request }) => {
  return app.handle(request);
};
