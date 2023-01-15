// PCRT-REST, a RESTful API for PC Repair Tracker.
// Triarom Engineering (c) 2022

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import winston from "winston";
import YAML from 'yaml';

// Setup database
import DatabaseInterface from './database_interfaces/db.js';

// Import router routes
import CustomerRoutes from './routes/customers.js';
import WorkOrderRoutes from './routes/work_order.js';
import WorkOrdersRoutes from './routes/work_orders.js';

// Setup Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'pcrt-rest' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
  ],
});

// Create winston logger for access logs
const access_logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'pcrt-rest' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.colorize()
  ),
  transports: [
    new winston.transports.File({ filename: 'access.log' }),
    new winston.transports.Console(),
  ],
});

// Read in yaml configuration file
const config_file_path = process.env.CONFIG_FILE_PATH || './config.yaml';

// Check the config.yaml file exists
if (!fs.existsSync(config_file_path)) {
  logger.error(`FATAL: config file ${config_file_path} does not exist, override location with CONFIG_FILE_PATH env.`);
  process.exit(1);
}

// Read and parse config file
const config = YAML.parse(fs.readFileSync(config_file_path, 'utf8'));

// Verify required settings are present
const required_config_settings = ["database", "database.host", "database.user", "database.password", "database.database", "pcrt", "pcrt.url", "pcrt.work_order", "pcrt.work_order.complete_status_id"];
for (const setting of required_config_settings) {
  if (!setting.split(".").reduce((o, i) => o[i], config)) {
    logger.error(`FATAL: config file ${config_file_path} missing required setting ${setting}`);
    process.exit(1);
  }
}
logger.info("config file ok");

// Setup database
const database = new DatabaseInterface(logger, config);

// Setup express
const app = express();
app.use(cors());
app.use(express.json());

// Setup handle all route
app.use(async(req, res, next) => {
  logger.debug(`inbound request: ${req.method} ${req.url}`);
  access_logger.info(`${req.method} ${req.url}`);
  next();
});

// == Route Configuration ==

// Customers
const customer_routes = new CustomerRoutes(logger, database);
app.use('/api/v1/customer', customer_routes.router);

// Work Orders
const work_order_routes = new WorkOrderRoutes(logger, database);
const work_orders_routes = new WorkOrdersRoutes(logger, database);
app.use('/api/v1/work_order', work_order_routes.router);
app.use('/api/v1/work_orders', work_orders_routes.router);

// Start server
const port = process.env.LISTEN_PORT || 3000;

app.listen(port, () => {
  logger.info(`server started on port ${port}`);
});