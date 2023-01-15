// Work Orders REST endpoints
// Typically used for finding work orders.
// Triarom Engineering (c) 2023

import express from 'express';

// Import required interfaces
import WorkOrderInterface from '../database_interfaces/work_order.js';

class WorkOrdersRoutes {
  constructor(logger, database) {
    this.logger = logger;
    this.database = database;
    this.router = express.Router();

    // Add routes to router.
    this.router.get("/open", this.get_open_work_orders.bind(this));
  }

  async get_open_work_orders(req, res) {
    const work_order_interface = new WorkOrderInterface(this.database, this.logger);

    const work_orders = await work_order_interface.get_open_work_orders(req.query.status || "any");
    if (!work_orders) {
      res.status(404).send();
      return;
    }
    res.status(200).json(work_orders);
  }
}

export default WorkOrdersRoutes;