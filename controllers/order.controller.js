const Order = require("../models/order.model");
const Artwork = require("../models/artwork.model");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");

// =======================
// CREATE ORDER
// =======================
exports.create = async (req, res) => {
  const rid = req.requestId;

  try {
    const { id_buyer, id_artwork } = req.body;

    logger.info(
      `request_id=${rid} action=createOrder status=start id_buyer=${id_buyer} id_artwork=${id_artwork}`
    );

    if (!id_buyer || !id_artwork) {
      logger.warn(
        `request_id=${rid} action=createOrder status=invalid reason=missing_data`
      );
      return res.json({
        status: false,
        message: "Invalid request"
      });
    }

    const art = await Artwork.getDetail(id_artwork);
    if (!art) {
      logger.warn(
        `request_id=${rid} action=createOrder status=not_found id_artwork=${id_artwork}`
      );
      return res.json({
        status: false,
        message: "Artwork not found"
      });
    }

    if (art.status === "sold") {
      logger.warn(
        `request_id=${rid} action=createOrder status=invalid reason=artwork_sold id_artwork=${id_artwork}`
      );
      return res.json({
        status: false,
        message: "Artwork already sold"
      });
    }

    const existing = await Order.checkExistingOrder(id_buyer, id_artwork);
    if (existing) {
      logger.warn(
        `request_id=${rid} action=createOrder status=exists id_order=${existing.id_order}`
      );
      return res.json({
        status: false,
        message: "You already ordered this artwork",
        id_order: existing.id_order
      });
    }

    const id_order = await Order.insertOrder({
      id_buyer,
      total_price: art.price,
      payment_status: "unpaid",
      order_status: "waiting"
    });

    await Order.insertOrderItem({
      id_order,
      id_artwork,
      price: art.price
    });

    logger.info(
      `request_id=${rid} action=createOrder status=success id_order=${id_order} id_buyer=${id_buyer}`
    );

    res.json({
      status: true,
      message: "Order created successfully",
      id_order
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=createOrder status=error error=${error.message}`
    );
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};


// =======================
// MY ORDER AS BUYER
// =======================
exports.myAsBuyer = async (req, res) => {
  const rid = req.requestId;
  const { id_buyer } = req.query;

  logger.info(
    `request_id=${rid} action=myOrderBuyer status=start id_buyer=${id_buyer}`
  );

  try {
    if (!id_buyer) {
      logger.warn(
        `request_id=${rid} action=myOrderBuyer status=invalid reason=missing_id`
      );
      return res.json({
        status: false,
        message: "id_buyer tidak boleh kosong",
        data: []
      });
    }

    const orders = await Order.getMyOrders(id_buyer);
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info(
      `request_id=${rid} action=myOrderBuyer status=success total=${orders.length}`
    );

    res.json({
      status: true,
      data: orders
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=myOrderBuyer status=error error=${error.message}`
    );
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};


// =======================
// MY ORDER AS ADMIN
// =======================
exports.getAllOrdersAdmin = async (req, res) => {
  const rid = req.requestId;

  logger.info(
    `request_id=${rid} action=listOrderAdmin status=start`
  );

  try {
    const orders = await Order.getAllOrders();
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info(
      `request_id=${rid} action=listOrderAdmin status=success total=${orders.length}`
    );

    res.json({
      status: true,
      data: orders
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=listOrderAdmin status=error error=${error.message}`
    );
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};


// =======================
// MY ORDER AS CREATOR
// =======================
exports.myAsCreator = async (req, res) => {
  const rid = req.requestId;
  const { id_creator } = req.query;

  logger.info(
    `request_id=${rid} action=myOrderCreator status=start id_creator=${id_creator}`
  );

  try {
    if (!id_creator) {
      logger.warn(
        `request_id=${rid} action=myOrderCreator status=invalid reason=missing_id_creator`
      );
      return res.json({
        status: false,
        message: "id_creator tidak boleh kosong",
        data: []
      });
    }

    const orders = await Order.getOrdersByCreator(id_creator);

    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info(
      `request_id=${rid} action=myOrderCreator status=success id_creator=${id_creator} total=${orders.length}`
    );

    res.json({
      status: true,
      data: orders
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=myOrderCreator status=error id_creator=${id_creator} error=${error.message}`
    );

    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};

// =======================
// ORDER DETAIL
// =======================
exports.detail = async (req, res) => {
  const rid = req.requestId;
  const { id_order } = req.query;

  logger.info(
    `request_id=${rid} action=orderDetail status=start id_order=${id_order}`
  );

  try {
    if (!id_order) {
      logger.warn(
        `request_id=${rid} action=orderDetail status=invalid reason=missing_id`
      );
      return res.json({
        status: false,
        message: "id_order tidak boleh kosong",
        data: []
      });
    }

    const orders = await Order.getOrderDetail(id_order);
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info(
      `request_id=${rid} action=orderDetail status=success id_order=${id_order}`
    );

    res.json({
      status: true,
      data: orders
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=orderDetail status=error error=${error.message}`
    );
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};


// =======================
// UPLOAD PAYMENT
// =======================
exports.uploadPayment = async (req, res) => {
  const rid = req.requestId;

  try {
    const { id_order, amount } = req.body;
    const file = req.file;

    logger.info(
      `request_id=${rid} action=uploadPayment status=start id_order=${id_order}`
    );

    if (!id_order || !amount || !file) {
      logger.warn(
        `request_id=${rid} action=uploadPayment status=invalid`
      );
      return res.status(400).json({
        status: false,
        message: "Data tidak lengkap"
      });
    }

    const order = await Order.getOrder(id_order);
    if (!order) {
      logger.warn(
        `request_id=${rid} action=uploadPayment status=not_found id_order=${id_order}`
      );
      return res.status(404).json({
        status: false,
        message: "Order tidak ditemukan"
      });
    }

    await Order.updatePaymentProof(id_order, amount, file.filename);

    logger.info(
      `request_id=${rid} action=uploadPayment status=success id_order=${id_order} amount=${amount}`
    );

    res.json({
      status: true,
      message: "Bukti pembayaran berhasil diupload"
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=uploadPayment status=error error=${error.message}`
    );
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};


exports.acceptPayment = async (req, res) => {
  const rid = req.requestId;
  const { id_order } = req.body;

  logger.info(
    `request_id=${rid} action=acceptPayment status=start id_order=${id_order}`
  );

  try {
    await Order.updateAfterPaymentAccepted(id_order);

    logger.info(
      `request_id=${rid} action=acceptPayment status=success id_order=${id_order}`
    );

    res.json({
      status: true,
      message: "Pembayaran berhasil di-ACC dan order diselesaikan"
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=acceptPayment status=error id_order=${id_order} error=${error.message}`
    );

    res.status(500).json({
      status: false,
      message: "Gagal memproses pembayaran"
    });
  }
};


exports.rejectPayment = async (req, res) => {
  const rid = req.requestId;
  const { id_order } = req.body;

  logger.info(
    `request_id=${rid} action=rejectPayment status=start id_order=${id_order}`
  );

  try {
    await Order.updateStatus(id_order, 'rejected');

    logger.info(
      `request_id=${rid} action=rejectPayment status=success id_order=${id_order}`
    );

    res.json({
      status: true,
      message: "Pembayaran berhasil ditolak"
    });

  } catch (error) {
    logger.error(
      `request_id=${rid} action=rejectPayment status=error error=${error.message}`
    );
    res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
};
exports.downloadOrderArtwork= async (req, res) => {
    const rid = req.requestId;
    const id_order = req.params.id;

    try {
      logger.info(
        `request_id=${rid} action=downloadOrderArtwork status=start id_order=${id_order}`
      );

      // 1️⃣ ambil id_artwork dari order
      const orderItem = await Order.getOrderItemByOrder(id_order);

      if (!orderItem) {
        return res.status(404).json({
          status: false,
          message: "Order item not found",
        });
      }

      const id_artwork = orderItem.id_artwork;

      // 2️⃣ ambil semua image artwork
      const images = await Artwork.getImagesByArtwork(id_artwork);

      if (!images.length) {
        return res.status(404).json({
          status: false,
          message: "No artwork images found",
        });
      }

      // 3️⃣ header zip
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=order_${id_order}_artwork.zip`
      );
      res.setHeader("Content-Type", "application/zip");

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);

      // 4️⃣ masukkan file ke zip
      for (const img of images) {
        const filePath = path.join(originalPath, img.image_url);

        if (fs.existsSync(filePath)) {
          archive.file(filePath, {
            name: img.image_url,
          });
        }
      }

      await archive.finalize();

      logger.info(
        `request_id=${rid} action=downloadOrderArtwork status=success id_order=${id_order}`
      );
    } catch (err) {
      logger.error(
        `request_id=${rid} action=downloadOrderArtwork status=error error=${err.message}`
      );

      if (!res.headersSent) {
        res.status(500).json({
          status: false,
          message: "Download failed",
        });
      }
    }
  };