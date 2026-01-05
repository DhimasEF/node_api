const jwt = require("jsonwebtoken");

const secret_key = "flystudio_secret_key"; // ⬅️ SAMA PERSIS

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.apiResponse(
      { message: "Unauthorized" },
      401
    );
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.apiResponse(
      { message: "Token tidak valid" },
      401
    );
  }

  try {
    const decoded = jwt.verify(token, secret_key);

    req.user = {
      id_user: decoded.id_user,
      role: decoded.role,
    };

    next();
  } catch (err) {
    return res.apiResponse(
      { message: "Token expired / invalid" },
      401
    );
  }
};
