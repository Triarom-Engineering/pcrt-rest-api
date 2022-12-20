// Work Order REST endpoints
// Triarom Engineering (c) 2022

import express from 'express';

// Import required interfaces
import WorkOrderInterface from '../database_interfaces/work_order.js';

class WorkOrderRoutes {
  constructor(logger, database) {
    this.logger = logger;
    this.database = database;
    this.router = express.Router();

    // Add routes to router.
    this.router.get("/:id", this.get_work_order.bind(this));
  }

  async get_work_order(req, res) {
    const work_order_interface = new WorkOrderInterface(this.database, this.logger);

    const work_order = await work_order_interface.get_work_order_by_id(req.params.id);
    if (!work_order) {
      res.status(404).json({
        "error": "invalid_work_order",
        "description": "Invalid work order specified."
      });
      return;
    }
    res.status(200).json(work_order);
  }
}

export default WorkOrderRoutes;