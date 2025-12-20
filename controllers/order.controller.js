const Order = require("../models/order.model");
const Artwork = require("../models/artwork.model");
const logger = require("../utils/logger");
const path = require("path");
const fs = require("fs");

// =======================
// CREATE ORDER
// =======================
exports.create = async (req, res) => {
    try {
        const { id_buyer, id_artwork } = req.body;

        if (!id_buyer || !id_artwork) {
            logger.warn("Create order gagal: data tidak lengkap", { id_buyer, id_artwork });
            return res.json({
                status: false,
                message: "Invalid request"
            });
        }

        // Ambil artwork
        const art = await Artwork.getDetail(id_artwork);
        if (!art) {
            logger.warn("Artwork tidak ditemukan", { id_artwork });
            return res.json({
                status: false,
                message: "Artwork not found"
            });
        }

        if (art.status === "sold") {
            logger.warn("Artwork sudah terjual", { id_artwork });
            return res.json({
                status: false,
                message: "Artwork already sold"
            });
        }

        // Cek order existing
        const existing = await Order.checkExistingOrder(id_buyer, id_artwork);
        if (existing) {
            logger.warn("Order sudah pernah dibuat", { id_buyer, id_artwork });
            return res.json({
                status: false,
                message: "You already ordered this artwork",
                id_order: existing.id_order
            });
        }

        // Insert order
        const id_order = await Order.insertOrder({
            id_buyer,
            total_price: art.price,
            payment_status: "pending",
            order_status: "waiting"
        });

        // Insert order item
        await Order.insertOrderItem({
            id_order,
            id_artwork,
            price: art.price
        });

        logger.info("Order berhasil dibuat", { id_order, id_buyer });

        res.json({
            status: true,
            message: "Order created successfully",
            id_order
        });

    } catch (error) {
        logger.error("Create order error", { error });
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
    try {
        const { id_buyer } = req.query;

        if (!id_buyer) {
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

        res.json({
            status: true,
            data: orders
        });

    } catch (error) {
        logger.error("Get my orders buyer error", { error });
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
    try {
        const orders = await Order.getAllOrders();

        orders.forEach(o => {
            o.images = o.images ? o.images.split(",") : [];
        });

        res.json({
            status: true,
            data: orders
        });

    } catch (error) {
        logger.error("Get all orders admin error", { error });
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
    try {
        const { id_creator } = req.query;

        if (!id_creator) {
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

        res.json({
            status: true,
            data: orders
        });

    } catch (error) {
        logger.error("Get my orders creator error", { error });
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
    try {
        const { id_order } = req.query;

        if (!id_order) {
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

        res.json({
            status: true,
            data: orders
        });

    } catch (error) {
        logger.error("Order detail error", { error });
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
  try {
    const { id_order, amount } = req.body;
    const file = req.file;

    if (!id_order || !amount) {
      return res.status(400).json({
        status: false,
        message: "Data tidak lengkap",
      });
    }

    if (!file) {
      return res.status(400).json({
        status: false,
        message: "Bukti pembayaran wajib diupload",
      });
    }

    const order = await Order.getOrder(id_order);
    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order tidak ditemukan",
      });
    }

    // simpan filename saja (tanpa path)
    const filename = file.filename;

    await Order.updatePaymentProof(
      id_order,
      amount,
      filename
    );

    logger.info("Upload bukti pembayaran berhasil", {
      id_order,
      amount,
      file: filename,
    });

    return res.json({
      status: true,
      message: "Bukti pembayaran berhasil diupload",
      data: {
        id_order,
        amount,
        bukti: filename,
      },
    });

  } catch (error) {
    logger.error("Upload payment error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

exports.acceptPayment = async (req, res) => {
    try {
        const { id_order } = req.body;

        if (!id_order) {
            return res.json({
                status: false,
                message: "id_order tidak boleh kosong"
            });
        }

        const order = await Order.getOrder(id_order);
        if (!order) {
            return res.json({
                status: false,
                message: "Order tidak ditemukan"
            });
        }

        await Order.updateStatus(id_order, 'paid');

        logger.info("Pembayaran di-ACC", { id_order });

        res.json({
            status: true,
            message: "Pembayaran berhasil di-ACC"
        });

    } catch (error) {
        logger.error("Accept payment error", { error });
        res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
};

exports.rejectPayment = async (req, res) => {
    try {
        const { id_order } = req.body;

        if (!id_order) {
            return res.json({
                status: false,
                message: "id_order tidak boleh kosong"
            });
        }

        const order = await Order.getOrder(id_order);
        if (!order) {
            return res.json({
                status: false,
                message: "Order tidak ditemukan"
            });
        }

        await Order.updateStatus(id_order, 'rejected');

        logger.info("Pembayaran ditolak", { id_order });

        res.json({
            status: true,
            message: "Pembayaran berhasil ditolak"
        });

    } catch (error) {
        logger.error("Reject payment error", { error });
        res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
};


