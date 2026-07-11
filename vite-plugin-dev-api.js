import { loadEnv } from 'vite';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Dev-only Vite middleware that runs the Vercel serverless functions in
 * api/*.js in-process during `npm run dev`, so they don't need `vercel dev`
 * (which has repeatedly failed to pull SUPABASE_SERVICE_ROLE_KEY locally for
 * this project). Production still deploys the real api/ folder to Vercel
 * unchanged — this plugin only patches the local Vite dev server.
 */
export default function devApiPlugin() {
  return {
    name: 'dev-api-functions',
    apply: 'serve',
    configureServer(server) {
      // loadEnv's third arg is a prefix filter — '' means "load everything",
      // not just VITE_-prefixed vars, mirroring what Vercel injects into
      // serverless functions at runtime.
      const env = loadEnv(server.config.mode, process.cwd(), '');
      Object.assign(process.env, env);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const [urlPath] = req.url.split('?');
        const fnName = urlPath.replace('/api/', '');
        const filePath = path.resolve(process.cwd(), 'api', `${fnName}.js`);

        let handlerModule;
        try {
          // Cache-bust so edits to the handler are picked up without restarting.
          handlerModule = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
        } catch {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `No dev API handler found for ${req.url}` }));
          return;
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            req.body = {};
          }
        }

        // Vercel gives handlers res.status()/res.json() helpers that don't
        // exist on a plain Node ServerResponse — shim them here.
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (body) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(body));
          return res;
        };

        try {
          await handlerModule.default(req, res);
        } catch (err) {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      });
    },
  };
}
