// Customer database object
// Triarom Engineering (c) 2022

class CustomerInterface {
  constructor(database, logger) {
    this.logger = logger.child({ module: 'CustomerInterface' });
    this.database = database;
  }

  async format_customer(customer){
    // Format a customer object, this is used to convert the customer object from the database into a format that is
    // suitable for the API.
    this.logger.debug(`format_customer: ${customer.id} (${customer.name})`);
    const formatted_customer = {
      id: customer.pcgroupid || customer.pcid,
      type: (customer.pcgroupid) ? 'group' : 'asset',
      name: customer.pcgroupname || customer.pcname,
      phone: {
        home: customer.grpphone || customer.pcphone || null,
        mobile: customer.grpcellphone || customer.pccellphone || null,
        work: customer.grpworkphone || customer.pcworkphone || null,
      },
      email: customer.grpemail || customer.pcemail || null,
      address: {
        line_1: customer.grpaddress1 || customer.pcaddress1 || null,
        line_2: customer.grpaddress2 || customer.pcaddress2 || null,
        city: customer.grpcity || customer.pccity || null,
        state: customer.grpstate || customer.pcstate || null,
        post_code: customer.grpzip || customer.pczip || null,
      },
      preferred_contact: customer.grpprefcontact || customer.pcprefcontact || null,
      notes: customer.grpnotes || customer.pcnotes || null,
      company: customer.grpcompany || customer.pccompany || null
    }
    this.logger.debug(`format_customer: returning ${JSON.stringify(formatted_customer)}`);
    return formatted_customer;
  }

  async get_customer_by_id(id) {
    // Get a customer by pc_group.pcgroupid, return null if not found.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_customer_by_id: ${id}`);
    const data = await connection.query(`SELECT * FROM pc_group WHERE pcgroupid = ?`, [id]);
    
    if (!data) {
      this.logger.warn(`get_customer_by_id: lookup failed for id ${id}`);
      return null;
    }

    if (data.length === 0) {
      this.logger.debug(`get_customer_by_id: no results for id ${id}`);
      return null;
    }

    if (data.length > 1) {
      this.logger.warn(`get_customer_by_id: multiple results for id ${id}`);
    }

    const customer = await this.format_customer(data[0]);

    this.logger.debug(`get_customer_by_id: returning customer ${customer.id} (${customer.name})`);
    await connection.release();

    return customer;
  }

  async get_customer_by_pc_id(id) {
    // Get a customer by a PC ID, this finds the PC, the finds the group number and fetches the customer.
    const connection = await this.database.get_connection();
    this.logger.debug(`get_customer_by_pc_id: ${id}`);

    const data = await connection.query(`SELECT * FROM pc_owner WHERE pcid = ?`, [id]);

    if (!data) {
      this.logger.warn(`get_customer_by_pc_id: lookup failed for id ${id}`);
      return null;
    }

    if (data.length === 0) {
      this.logger.debug(`get_customer_by_pc_id: no results for id ${id}`);
      return null;
    }

    let customer;
    if (data[0].pcgroupid === 0) {
      this.logger.debug(`get_customer_by_pc_id: pc ${id} has no group, will use asset rather than group.`);
      customer = await this.format_customer(data[0]);
    } else {
      this.logger.debug(`resolved pcid ${id} to pcgroupid ${data[0].pcgroupid}, fetching customer`)
      customer = await this.get_customer_by_id(data[0].pcgroupid);
      await connection.release();
    }
    
    return customer;
  }

  async get_assets_by_customer_id(id) {
    // Return all PC assets for a customer, id should be a pcgroupid.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_customer_assets: ${id}`);
    const data = await connection.query(`SELECT * FROM pc_owner WHERE pcgroupid = ?`, [id]);

    if (!data) {
      this.logger.warn(`get_customer_assets: lookup failed for id ${id}`);
      return null;
    }

    if (data.length === 0) {
      this.logger.debug(`get_customer_assets: no results for id ${id}`);
      return null;
    }

    const assets = data.map((asset) => {
      // TODO: Implement PC type (i.e., laptop, desktop, etc.)
      // NOTE: it is possible for the PC group to deviate from the PC entry.
      // This isn't handled by PCRT-REST as it isn't a commonly used feature in PCRT.
      return {
        id: asset.pcid,
        make: asset.pcmake,
      }
    });

    this.logger.debug(`get_customer_assets: returning ${assets.length} assets for customer ${id}`);
    await connection.release();

    return assets;
  }

  async get_customer_asset(id) {
    // Return a single PC asset for a customer, id should be a pcid.
    const connection = await this.database.get_connection();

    this.logger.debug(`get_customer_asset: ${id}`);
    const data = await connection.query(`SELECT * FROM pc_owner WHERE pcid = ?`, [id]);

    if (!data) {
      this.logger.warn(`get_customer_asset: lookup failed for id ${id}`);
      return null;
    }

    if (data.length === 0) {
      this.logger.debug(`get_customer_asset: no results for id ${id}`);
      return null;
    }

    if (data.length > 1) {
      this.logger.warn(`get_customer_asset: multiple results for id ${id}`);
    }

    const asset = {
      id: data[0].pcid,
      customer_id: data[0].pcgroupid,
      make: data[0].pcmake,
    }
    await connection.release();

    return asset;
  }
}

export default CustomerInterface;