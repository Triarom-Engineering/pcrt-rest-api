// Customers REST endpoints.
// Triarom Engineering (c) 2022

import express from 'express';

// Import required interfaces
import CustomerInterface from '../database_interfaces/customer.js';
import WorkOrderInterface from '../database_interfaces/work_order.js';

class CustomerRoutes {
  constructor(logger, database) {
    this.logger = logger;
    this.database = database;
    this.router = express.Router();
    this.work_order_interface = new WorkOrderInterface(this.database, this.logger);

    // Add routes to router.
    this.router.get("/:id", this.get_customer_by_id.bind(this));
    this.router.get("/:id/work_orders", this.get_work_orders_for_customer.bind(this));
    this.router.get("/:id/assets", this.get_assets_for_customer.bind(this));
    this.router.get("/:id/asset/:asset_id", this.get_customer_asset_by_id.bind(this));
  }

  async get_customer_by_id(req, res) {
    const customer_interface = new CustomerInterface(this.database, this.logger);

    const customer = await customer_interface.get_customer_by_id(req.params.id);
    if (!customer) {
      res.status(404).json({
        "error": "invalid_customer",
        "description": "Invalid customer specified."
      });
      return;
    }
    res.status(200).json(customer);
  }

  async get_work_orders_for_customer(req, res) {
    const customer_interface = new CustomerInterface(this.database, this.logger);

    // Verify the customer exists
    const customer = await customer_interface.get_customer_by_id(req.params.id);
    if (!customer) {
      res.status(404).json({
        "error": "invalid_customer",
        "description": "Invalid customer specified."
      });

      return;
    }

    const work_orders = await this.work_order_interface.get_work_order_by_customer_id(req.params.id);
    if (!work_orders) {
      res.status(404).send();
      return;
    }
    res.status(200).json(work_orders);
  }

  async get_assets_for_customer(req, res) {
    const customer_interface = new CustomerInterface(this.database, this.logger);

    // Verify the customer exists
    const customer = await customer_interface.get_customer_by_id(req.params.id);
    if (!customer) {
      res.status(404).json({
        "error": "invalid_customer",
        "description": "Invalid customer specified."
      });

      return;
    }

    const assets = await customer_interface.get_assets_by_customer_id(req.params.id);
    if (!assets) {
      res.status(500).send();
      return;
    }
    res.status(200).json(assets);
  }

  async get_customer_asset_by_id(req, res) {
    const customer_interface = new CustomerInterface(this.database, this.logger);

    // Verify the customer exists
    const customer = await customer_interface.get_customer_by_id(req.params.id);
    if (!customer) {
      res.status(404).json({
        "error": "invalid_customer",
        "description": "Invalid customer specified."
      });

      return;
    }

    const asset = await customer_interface.get_customer_asset(req.params.asset_id);
    if (!asset) {
      res.status(404).send({
        "error": "invalid_asset",
        "description": "Invalid asset specified."
      });
      return;
    }

    // Verify the asset belongs to the customer
    if (asset.customer_id != req.params.id) {
      res.status(404).send({
        "error": "invalid_asset",
        "description": "Invalid asset specified."
      });
      return;
    }

    res.status(200).json(asset);
  }
}

export default CustomerRoutes;