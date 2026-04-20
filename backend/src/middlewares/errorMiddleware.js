export const errorHandler = (error, req, res, next) => {
  console.error(error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error"
  });
};
