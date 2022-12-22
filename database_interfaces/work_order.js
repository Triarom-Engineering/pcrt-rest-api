// Work order database object
// Triarom Engineering (c) 2022

import CustomerInterface from './customer.js';

const call_types = {
  1: 'Not Called',
  2: 'Called',
  7: 'Left Voicemail',
  5: 'Sent SMS',
  6: 'Sent Email',
  3: 'Called, No Answer',
  4: 'Called, Waiting for Call Back',
}

class WorkOrderInterface {
  constructor(database, logger) {
    this.logger = logger.child({ module: 'WorkOrderInterface' });
    this.database = database;
    this.customerInterface = new CustomerInterface(database, logger);
  }

  async get_work_order_statues() {
    // Get available work order statuses, this is provided by boxstyles in PCRT.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_work_order_statues`);
    const data = await connection.query(`SELECT * FROM boxstyles`);

    if (!data) {
      this.logger.error(`get_work_order_statues: lookup failed`);
      return null;
    }

    if (data.length === 0) {
      this.logger.error(`get_work_order_statues: no results`);
      return null;
    }

    const statuses = [];

    for (const row of data) {
      statuses.push({
        id: row.statusid,
        name: row.boxtitle,
      });
    }

    // this.logger.debug(`get_work_order_statues: returning ${JSON.stringify(statuses)}`);
    await connection.release();

    return statuses;
  }

  async get_notes_for_job(id) {
    // Get notes for a job, this is provided by wonotes in PCRT.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_notes_for_job: ${id}`);
    const data = await connection.query(`SELECT * FROM wonotes WHERE woid = ?`, [id]);

    if (!data) {
      this.logger.warn(`get_notes_for_job: lookup failed for id ${id}`);
      return null;
    }

    let notes = {
      "internal": [],
      "external": [],
    }

    for (const row of data) {
      if (row.notetype === 1) {
        // Internal/private notes
        notes.internal.push({
          id: row.noteid,
          date: row.notetime,
          engineer: row.noteuser,
          text: row.thenote,
        });
      } else if (row.notetype === 0) {
        // External/public notes
        notes.external.push({
          id: row.noteid,
          date: row.notetime,
          engineer: row.noteuser,
          text: row.thenote,
        });
      }
    }
    await connection.release();

    return notes;
  }

  async format_work_order(data) {
    // Format a work order from the database into a JSON object.

    const customer = await this.customerInterface.get_customer_by_pc_id(data.pcid);
    const notes = await this.get_notes_for_job(data.woid);
    const statuses = await this.get_work_order_statues();

    const work_order = {
      "id": data.woid,
      "pcid": data.pcid,
      "customer": customer,
      "job_description": data.probdesc,
      "job_notes": notes,
      "priority": data.pcpriority || null,
      "drop_off_date": new Date(data.dropdate) || null,
      "ready_date": new Date(data.readydate) || null,
      "collected_date": new Date(data.pickupdate) || null,
      "status": statuses.find((status) => status.id === data.pcstatus),
      "call_type": call_types[data.called] || "Not Specified",
    }

    return work_order;
  }

  async get_work_order_by_id(id) {
    // Get a work order by it's ID.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_work_order_by_id: ${id}`);
    const data = await connection.query(`SELECT * FROM pc_wo WHERE woid = ?`, [id]);

    if (!data) {
      this.logger.warn(`get_work_order_by_id: lookup failed for id ${id}`);
      return null;
    }

    if (data.length === 0) {
      this.logger.debug(`get_work_order_by_id: no results for id ${id}`);
      return null;
    }

    if (data.length > 1) {
      this.logger.warn(`get_work_order_by_id: multiple results for id ${id}`);
    }

    await connection.release();

    return this.format_work_order(data[0]);
  }

  async get_work_order_by_customer_id(id, status_id = null) {
    // Get all work orders for customer, optionally filter by status.
    // If status_id is not specified, any work order will be returned.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_work_order_by_customer_id: ${id}, status: ${status_id}`);

    // Find all PC assets for this customer
    const assets = await this.customerInterface.get_assets_by_customer_id(id);

    if (!assets) {
      this.logger.debug(`get_work_order_by_customer_id: no assets found for customer ${id}`);
      return null;
    }

    // Find all work orders for these assets
    let data = await connection.query(`SELECT * FROM pc_wo WHERE pcid IN (?)`, [assets.map((asset) => asset.id)]);

    if (!data) {
      this.logger.warn(`get_work_order_by_customer_id: lookup failed for id ${id}`);
      return null;
    }

    if (status_id) {
      this.logger.debug(`get_work_order_by_customer_id: filtering by status ${status_id}`);
      data = data.filter((row) => row.pcstatus === status_id);
    }

    if (data.length === 0) {
      this.logger.debug(`get_work_order_by_customer_id: no results for id ${id}`);
      return null;
    }

    let work_orders = [];

    for (const row of data) {
      this.logger.debug(`get_work_order_by_customer_id: formatting work order ${row.woid}`);
      work_orders.push(await this.format_work_order(row));
    }

    this.logger.debug(`get_work_order_by_customer_id: returning ${work_orders.length} work orders`)
    await connection.release();

    return work_orders;
  }
}

export default WorkOrderInterface;