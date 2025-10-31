import express from "express";
import { PORT } from "./config";
import { paymentMiddlewareConfig } from "./config";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(paymentMiddlewareConfig);
app.use(routes);

app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}\n`);
  console.log(`📍 Endpoints:`);
  console.log(`   GET  /               - Public`);
  console.log(`   GET  /premium        - $0.0001 USDC`);
  console.log(`   POST /analyze-basic  - $0.005 USDC\n`);
});
