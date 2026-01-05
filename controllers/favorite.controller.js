// const Favorite = require("../models/favorite.model");
// const logger = require("../utils/logger");

// module.exports = {

//   // =========================================
//   // TOGGLE FAVORITE ARTWORK
//   // =========================================
//   toggleFavorite: async (req, res) => {
//     const request_id = req.requestId;
//     const id_user = req.user?.id_user;
//     const id_artwork = Number(req.params.id);

//     logger.info({
//       request_id,
//       action: "toggleFavorite",
//       status: "start",
//       id_user,
//       id_artwork
//     });

//     if (!id_user || !id_artwork) {
//       logger.warn({
//         request_id,
//         action: "toggleFavorite",
//         status: "invalid",
//         reason: "missing_parameter",
//         id_user,
//         id_artwork
//       });

//       return res.apiResponse(
//         { message: "Parameter tidak valid" },
//         400
//       );
//     }

//     try {
//       const isFav = await Favorite.isFavorited(id_user, id_artwork);

//       if (isFav) {
//         await Favorite.remove(id_user, id_artwork);

//         logger.info({
//           request_id,
//           action: "toggleFavorite",
//           status: "removed",
//           id_user,
//           id_artwork
//         });
//       } else {
//         await Favorite.add(id_user, id_artwork);

//         logger.info({
//           request_id,
//           action: "toggleFavorite",
//           status: "added",
//           id_user,
//           id_artwork
//         });
//       }

//       const total = await Favorite.count(id_artwork);

//       logger.info({
//         request_id,
//         action: "toggleFavorite",
//         status: "success",
//         id_user,
//         id_artwork,
//         favorited: !isFav,
//         total
//       });

//       return res.apiResponse(
//         {
//           favorited: !isFav,
//           total_favorite: total
//         },
//         200
//       );

//     } catch (error) {
//       logger.error({
//         request_id,
//         action: "toggleFavorite",
//         status: "error",
//         id_user,
//         id_artwork,
//         error: error.message
//       });

//       return res.apiResponse(
//         { message: "Database error" },
//         500
//       );
//     }
//   },

//   // =========================================
//   // GET FAVORITE STATUS
//   // =========================================
//   getFavoriteStatus: async (req, res) => {
//     const request_id = req.requestId;
//     const id_user = req.user?.id_user;
//     const id_artwork = Number(req.params.id);

//     logger.info({
//       request_id,
//       action: "getFavoriteStatus",
//       status: "start",
//       id_user,
//       id_artwork
//     });

//     if (!id_user || !id_artwork) {
//       logger.warn({
//         request_id,
//         action: "getFavoriteStatus",
//         status: "invalid",
//         reason: "missing_parameter",
//         id_user,
//         id_artwork
//       });

//       return res.apiResponse(
//         { message: "Parameter tidak valid" },
//         400
//       );
//     }

//     try {
//       const isFav = await Favorite.isFavorited(id_user, id_artwork);
//       const total = await Favorite.count(id_artwork);

//       logger.info({
//         request_id,
//         action: "getFavoriteStatus",
//         status: "success",
//         id_user,
//         id_artwork,
//         favorited: isFav,
//         total
//       });

//       return res.apiResponse(
//         {
//           favorited: isFav,
//           total_favorite: total
//         },
//         200
//       );

//     } catch (error) {
//       logger.error({
//         request_id,
//         action: "getFavoriteStatus",
//         status: "error",
//         id_user,
//         id_artwork,
//         error: error.message
//       });

//       return res.apiResponse(
//         { message: "Database error" },
//         500
//       );
//     }
//   }
// };
