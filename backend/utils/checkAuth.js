import jwt from "jsonwebtoken";

const jwt_key = process.env.JWT_KEY;

export const checkAuth = (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");
  // const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, jwt_key);

      req.userId = decoded._id;
      next();
    } catch (error) {
      console.log(error);
      return res.status(403).json({ title: "Ooops..", message: "You don't have access" });
    }
  } else {
    // return so we never send two responses
    return res.status(403).json({ title: "Ooops..", message: "You don't have access" });
  }
};
