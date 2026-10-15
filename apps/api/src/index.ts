import app from './app';

const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
