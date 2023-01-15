// Repair Cart database object
// Triarom Engineering (c) 2022

// This interface collects "repair cart" information, this is a list of items added to a work order,
// such as replacement parts and labour.

class RepairCartInterface {
  constructor(database, logger) {
    this.logger = logger.child({ module: 'RepairCartInterface' });
    this.database = database;
  }

  async format_repair_item(repair_item) {
    // Format a repair item for output.
    const formatted_repair_item = {
      id: repair_item.cart_item_id,
      type: repair_item.cart_type,
      stock_id: repair_item.cart_stock_id,
      labor_desc: repair_item.cart_labor_desc,
      // created_date: new Date(repair_item.addtime).toISOString(),
      taxex: repair_item.taxex,
      item_tax: repair_item.itemtax,
      original_price: repair_item.origprice,
      discount_type: repair_item.discounttype,
      our_price: repair_item.ourprice,
      item_serial_number: repair_item.itemserial,
      quantity: repair_item.quantity,
      unit_price: repair_item.unit_price,
    };

    return formatted_repair_item;
  }

  async get_repair_items_for_work_order(work_order_id) {
    // Get the repair items for a work order.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_repair_items_for_work_order: ${work_order_id}`);
    const data = await connection.query(`SELECT * FROM repaircart WHERE pcwo = ?`, [work_order_id]);

    await connection.release();

    if (!data) {
      this.logger.warn(`get_repair_items_for_work_order: lookup failed for work order id ${work_order_id}`);
      return null;
    }

    if (data.length === 0) {
      this.logger.debug(`get_repair_items_for_work_order: no results for work order id ${work_order_id}`);
      return null;
    }


    let repair_cost = {
      "items": [],
      "total": 0,
    }

    for (let i = 0; i < data.length; i++) {
      const item = await this.format_repair_item(data[i])
      repair_cost.items.push(item);
      repair_cost.total += (parseFloat(item.unit_price) + parseFloat(item.item_tax)) * parseInt(item.quantity);
    }

    this.logger.debug(`get_repair_items_for_work_order: returning ${repair_cost.items.length} repair items`);
    return repair_cost; 
  }
}

export default RepairCartInterface;