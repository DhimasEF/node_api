const Order = require("../models/order.model");
const Artwork = require("../models/artwork.model");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// =======================
// CREATE ORDER
// =======================
exports.create = async (req, res) => {
  const request_id = req.requestId;

  try {
    const { id_buyer, id_artwork } = req.body;

    logger.info({
      request_id,
      action: "createOrder",
      status: "start",
      payload: { id_buyer, id_artwork }
    });

    /* =========================
       VALIDATION
    ========================= */
    if (!id_buyer || !id_artwork) {
      logger.warn({
        request_id,
        action: "createOrder",
        status: "invalid",
        reason: "missing_data"
      });

      return res.apiResponse(
        { message: "Invalid request data" },
        400
      );
    }

    /* =========================
       CHECK ARTWORK
    ========================= */
    const art = await Artwork.getDetail(id_artwork);
    if (!art) {
      logger.warn({
        request_id,
        action: "createOrder",
        status: "not_found",
        id_artwork
      });

      return res.apiResponse(
        { message: "Artwork not found" },
        404
      );
    }

    if (art.status === "sold") {
      logger.warn({
        request_id,
        action: "createOrder",
        status: "invalid",
        reason: "artwork_sold",
        id_artwork
      });

      return res.apiResponse(
        { message: "Artwork already sold" },
        409
      );
    }

    /* =========================
       CHECK EXISTING ORDER
    ========================= */
    const existing = await Order.checkExistingOrder(id_buyer, id_artwork);
    if (existing) {
      logger.warn({
        request_id,
        action: "createOrder",
        status: "exists",
        id_order: existing.id_order
      });

      return res.apiResponse(
        {
          message: "You already ordered this artwork",
          id_order: existing.id_order
        },
        409
      );
    }

    /* =========================
       CREATE ORDER
    ========================= */
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

    logger.info({
      request_id,
      action: "createOrder",
      status: "success",
      id_order,
      id_buyer
    });

    return res.apiResponse(
      {
        message: "Order created successfully",
        id_order
      },
      201
    );

  } catch (error) {
    logger.error({
      request_id,
      action: "createOrder",
      status: "error",
      error: error.message,
      stack: error.stack
    });

    return res.apiResponse(
      { message: "Internal server error" },
      500
    );
  }
};

// =======================
// MY ORDER AS BUYER
// =======================
exports.myAsBuyer = async (req, res) => {
  const request_id = req.requestId;
  const { id_buyer } = req.query;

  logger.info({
    request_id,
    action: "myOrderBuyer",
    status: "start",
    query: { id_buyer }
  });

  try {
    if (!id_buyer) {
      logger.warn({
        request_id,
        action: "myOrderBuyer",
        status: "invalid",
        reason: "missing_id_buyer"
      });

      return res.apiResponse(
        { message: "id_buyer tidak boleh kosong", data: [] },
        400
      );
    }

    const orders = await Order.getMyOrders(id_buyer);
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info({
      request_id,
      action: "myOrderBuyer",
      status: "success",
      total: orders.length
    });

    return res.apiResponse(orders, 200);

  } catch (error) {
    logger.error({
      request_id,
      action: "myOrderBuyer",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Server error" },
      500
    );
  }
};

// =======================
// MY ORDER AS ADMIN
// =======================
exports.getAllOrdersAdmin = async (req, res) => {
  const request_id = req.requestId;

  logger.info({
    request_id,
    action: "listOrderAdmin",
    status: "start"
  });

  try {
    const orders = await Order.getAllOrders();
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info({
      request_id,
      action: "listOrderAdmin",
      status: "success",
      total: orders.length
    });

    return res.apiResponse(orders, 200);

  } catch (error) {
    logger.error({
      request_id,
      action: "listOrderAdmin",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Server error" },
      500
    );
  }
};

// =======================
// MY ORDER AS CREATOR
// =======================
exports.myAsCreator = async (req, res) => {
  const request_id = req.requestId;
  const { id_creator } = req.query;

  logger.info({
    request_id,
    action: "myOrderCreator",
    status: "start",
    query: { id_creator }
  });

  try {
    if (!id_creator) {
      logger.warn({
        request_id,
        action: "myOrderCreator",
        status: "invalid",
        reason: "missing_id_creator"
      });

      return res.apiResponse(
        { message: "id_creator tidak boleh kosong", data: [] },
        400
      );
    }

    const orders = await Order.getOrdersByCreator(id_creator);
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info({
      request_id,
      action: "myOrderCreator",
      status: "success",
      total: orders.length
    });

    return res.apiResponse(orders, 200);

  } catch (error) {
    logger.error({
      request_id,
      action: "myOrderCreator",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Server error" },
      500
    );
  }
};

// =======================
// ORDER DETAIL
// =======================
exports.detail = async (req, res) => {
  const request_id = req.requestId;
  const { id_order } = req.query;

  logger.info({
    request_id,
    action: "orderDetail",
    status: "start",
    query: { id_order }
  });

  try {
    if (!id_order) {
      return res.apiResponse(
        { message: "id_order tidak boleh kosong", data: [] },
        400
      );
    }

    const orders = await Order.getOrderDetail(id_order);
    orders.forEach(o => {
      o.images = o.images ? o.images.split(",") : [];
    });

    logger.info({
      request_id,
      action: "orderDetail",
      status: "success"
    });

    return res.apiResponse(orders, 200);

  } catch (error) {
    logger.error({
      request_id,
      action: "orderDetail",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Server error" },
      500
    );
  }
};

// =======================
// UPLOAD PAYMENT
// =======================
exports.uploadPayment = async (req, res) => {
  const request_id = req.requestId;
  const { id_order, amount } = req.body;
  const file = req.file;

  logger.info({
    request_id,
    action: "uploadPayment",
    status: "start",
    payload: { id_order, amount }
  });

  try {
    if (!id_order || !amount || !file) {
      return res.apiResponse(
        { message: "Data tidak lengkap" },
        400
      );
    }

    const order = await Order.getOrder(id_order);
    if (!order) {
      return res.apiResponse(
        { message: "Order tidak ditemukan" },
        404
      );
    }

    await Order.updatePaymentProof(id_order, amount, file.filename);

    logger.info({
      request_id,
      action: "uploadPayment",
      status: "success",
      id_order
    });

    return res.apiResponse(
      { message: "Bukti pembayaran berhasil diupload" },
      200
    );

  } catch (error) {
    logger.error({
      request_id,
      action: "uploadPayment",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Server error" },
      500
    );
  }
};

exports.acceptPayment = async (req, res) => {
  const request_id = req.requestId;
  const { id_order } = req.body;

  logger.info({
    request_id,
    action: "acceptPayment",
    status: "start",
    payload: { id_order }
  });

  try {
    if (!id_order) {
      return res.apiResponse(
        { message: "id_order tidak boleh kosong" },
        400
      );
    }

    const order = await Order.getOrder(id_order);
    if (!order) {
      return res.apiResponse(
        { message: "Order tidak ditemukan" },
        404
      );
    }

    await Order.updateAfterPaymentAccepted(id_order);

    logger.info({
      request_id,
      action: "acceptPayment",
      status: "success",
      id_order
    });

    return res.apiResponse(
      { message: "Pembayaran berhasil di-ACC dan order diselesaikan" },
      200
    );

  } catch (error) {
    logger.error({
      request_id,
      action: "acceptPayment",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Gagal memproses pembayaran" },
      500
    );
  }
};

exports.rejectPayment = async (req, res) => {
  const request_id = req.requestId;
  const { id_order } = req.body;

  logger.info({
    request_id,
    action: "rejectPayment",
    status: "start",
    payload: { id_order }
  });

  try {
    if (!id_order) {
      return res.apiResponse(
        { message: "id_order tidak boleh kosong" },
        400
      );
    }

    const order = await Order.getOrder(id_order);
    if (!order) {
      return res.apiResponse(
        { message: "Order tidak ditemukan" },
        404
      );
    }

    await Order.updateStatus(id_order, "rejected");

    logger.info({
      request_id,
      action: "rejectPayment",
      status: "success",
      id_order
    });

    return res.apiResponse(
      { message: "Pembayaran berhasil ditolak" },
      200
    );

  } catch (error) {
    logger.error({
      request_id,
      action: "rejectPayment",
      status: "error",
      error: error.message
    });

    return res.apiResponse(
      { message: "Server error" },
      500
    );
  }
};

exports.downloadOrderArtwork = async (req, res) => {
  const request_id = req.requestId;
  const id_order = req.params.id;

  logger.info({
    request_id,
    action: "downloadOrderArtwork",
    status: "start",
    params: { id_order }
  });

  try {
    const orderItem = await Order.getOrderItemByOrder(id_order);
    if (!orderItem) {
      logger.warn({
        request_id,
        action: "downloadOrderArtwork",
        status: "not_found",
        id_order
      });

      return res.status(404).json({
        message: "Order item not found"
      });
    }

    const images = await Artwork.getImagesByArtwork(orderItem.id_artwork);
    if (!images.length) {
      return res.status(404).json({
        message: "No artwork images found"
      });
    }

    const originalPath = path.join(
      __dirname,
      "..",
      "uploads",
      "artworks",
      "original"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order_${id_order}_artwork.zip`
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const img of images) {
      const filename = path.basename(img.image_url);
      const filePath = path.join(originalPath, filename);

      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: filename });
      } else {
        logger.warn({
          request_id,
          action: "downloadOrderArtwork",
          status: "file_missing",
          filePath
        });
      }
    }

    await archive.finalize();

    logger.info({
      request_id,
      action: "downloadOrderArtwork",
      status: "success",
      id_order
    });

  } catch (error) {
    logger.error({
      request_id,
      action: "downloadOrderArtwork",
      status: "error",
      error: error.message
    });

    if (!res.headersSent) {
      res.status(500).json({
        message: "Download failed"
      });
    }
  }
};
