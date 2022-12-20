// Customer database object
// Triarom Engineering (c) 2022

class CustomerInterface {
  constructor(database, logger) {
    this.logger = logger.child({ module: 'CustomerInterface' });
    this.database = database;
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

    const customer = {
      id: data[0].pcgroupid,
      name: data[0].pcgroupname,
      phone: {
        home: data[0].grpphone || null,
        mobile: data[0].grpcellphone || null,
        work: data[0].grpworkphone || null,
      },
      email: data[0].grpemail || null,
      address: {
        line_1: data[0].grpaddress1 || null,
        line_2: data[0].grpaddress2 || null,
        city: data[0].grpcity || null,
        state: data[0].grpstate || null,
        post_code: data[0].grpzip || null,
      },
      preferred_contact: data[0].grpprefcontact || null,
      notes: data[0].grpnotes || null,
      company: data[0].grpcompany || null
    }

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

    this.logger.debug(`resolved pcid ${id} to pcgroupid ${data[0].pcgroupid}, fetching customer`)
    const customer = await this.get_customer_by_id(data[0].pcgroupid);
    await connection.release();

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