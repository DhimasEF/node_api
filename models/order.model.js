const db = require("../config/db");

const Order = {

  // ============================
  // INSERT ORDER
  // ============================
  insertOrder: async (data) => {
    const [result] = await db.query(
      "INSERT INTO orders SET ?",
      data
    );
    return result.insertId;
  },

  // ============================
  // INSERT ORDER ITEM
  // ============================
  insertOrderItem: async (data) => {
    const [result] = await db.query(
      "INSERT INTO order_items SET ?",
      data
    );
    return result.affectedRows > 0;
  },

  // ============================
  // CHECK EXISTING ORDER
  // ============================
  checkExistingOrder: async (id_buyer, id_artwork) => {
    const [rows] = await db.query(`
      SELECT orders.id_order
      FROM orders
      JOIN order_items ON order_items.id_order = orders.id_order
      WHERE orders.id_buyer = ?
        AND order_items.id_artwork = ?
      LIMIT 1
    `, [id_buyer, id_artwork]);

    return rows[0] || null;
  },

  // ============================
  // GET MY ORDERS (BUYER)
  // ============================
  getMyOrders: async (id_buyer) => {
    const [rows] = await db.query(`
        SELECT 
        o.*,
        a.*,
        a.title AS artwork_title,
        a.status AS artwork_status,

        GROUP_CONCAT(ai.preview_url SEPARATOR ',') AS images
        FROM orders o
        JOIN order_items oi ON oi.id_order = o.id_order
        JOIN artworks a ON a.id_artwork = oi.id_artwork
        LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
        WHERE o.id_buyer = ?
        GROUP BY
        o.id_order,
        o.id_buyer,
        o.total_price,
        o.order_status,
        a.id_artwork,
        a.title,
        a.status
        ORDER BY o.id_order DESC
    `, [id_buyer]);

    return rows;
  },


  // ============================
  // GET ORDER DETAIL
  // ============================
  getOrderDetail: async (id_order) => {
    const [rows] = await db.query(`
      SELECT 
        o.*,
        a.*,
        a.title AS artwork_title,
        a.status AS artwork_status,
        GROUP_CONCAT(ai.preview_url SEPARATOR ',') AS images
      FROM orders o
      JOIN order_items oi ON oi.id_order = o.id_order
      JOIN artworks a ON a.id_artwork = oi.id_artwork
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      WHERE o.id_order = ?
      GROUP BY o.id_order, a.id_artwork
      ORDER BY o.id_order DESC
    `, [id_order]);

    return rows;
  },

  // ============================
  // GET ORDERS BY CREATOR
  // ============================
  getOrdersByCreator: async (id_creator) => {
    const [rows] = await db.query(`
      SELECT 
        o.*,
        a.*,
        a.title AS artwork_title,
        a.status AS artwork_status,
        GROUP_CONCAT(ai.preview_url SEPARATOR ',') AS images
      FROM orders o
      JOIN order_items oi ON oi.id_order = o.id_order
      JOIN artworks a ON a.id_artwork = oi.id_artwork
      LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
      WHERE a.id_user = ?
      GROUP BY o.id_order, a.id_artwork
      ORDER BY o.id_order DESC
    `, [id_creator]);

    return rows;
  },

  getAllOrders: async () => {
    const [rows] = await db.query(`
        SELECT 
            o.*,
            a.*,
            a.title AS artwork_title,
        a.status AS artwork_status,
        GROUP_CONCAT(ai.preview_url SEPARATOR ',') AS images
        FROM orders o
        JOIN order_items oi ON oi.id_order = o.id_order
        JOIN artworks a ON a.id_artwork = oi.id_artwork
        LEFT JOIN artwork_images ai ON ai.id_artwork = a.id_artwork
        GROUP BY o.id_order, a.id_artwork
        ORDER BY o.id_order DESC
     `);
      return rows;
  },

  // ============================
  // GET SINGLE ORDER
  // ============================
  getOrder: async (id_order) => {
    const [rows] = await db.query(
      "SELECT * FROM orders WHERE id_order = ? LIMIT 1",
      [id_order]
    );
    return rows[0] || null;
  },

  // ============================
  // UPDATE PAYMENT PROOF
  // ============================
  updatePaymentProof: async (id_order, amount, file) => {
    const [result] = await db.query(`
      UPDATE orders SET
        payment_status = 'pending',
        total_paid = ?,
        note = ?
      WHERE id_order = ?
    `, [amount, file, id_order]);

    return result.affectedRows > 0;
  },

  // ===============================
  // UPDATE STATUS ORDER
  // ===============================
  updateStatus: async (id_order, status) => {
    const [result] = await db.query(
      `UPDATE orders 
       SET payment_status = ?, updated_at = NOW() 
       WHERE id_order = ?`,
      [status, id_order]
    );

    return result.affectedRows > 0;
  },

  updateAfterPaymentAccepted: async (id_order) => {
    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();

      // 1. update order
      const [orderResult] = await conn.query(
        `UPDATE orders 
        SET payment_status = 'paid',
            order_status = 'completed',
            updated_at = NOW()
        WHERE id_order = ?`,
        [id_order]
      );

      if (orderResult.affectedRows === 0) {
        throw new Error("Order tidak ditemukan");
      }

      // 2. ambil artwork di order
      const [items] = await conn.query(
        `SELECT id_artwork 
        FROM order_items 
        WHERE id_order = ?`,
        [id_order]
      );

      // 3. update artwork jadi sold
      for (const item of items) {
        await conn.query(
          `UPDATE artworks 
          SET status = 'sold'
          WHERE id_artwork = ?`,
          [item.id_artwork]
        );
      }

      await conn.commit();
      return true;

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
  getOrderItemByOrder: async (id_order) => {
    const [rows] = await db.query(
      `SELECT id_artwork
      FROM order_items
      WHERE id_order = ?
      LIMIT 1`,
      [id_order]
    );

    return rows[0];
  },
};

module.exports = Order;
