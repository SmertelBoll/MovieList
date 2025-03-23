import jwt from "jsonwebtoken";

const jwt_key = process.env.JWT_KEY;

export const checkAuth = (req, res, next) => {
  const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");
  // const token = (req.headers.authorization || "").replace("Bearer ", "");

  if (token) {
    try {
      const decoded = jwt.verify(token, jwt_key);

      req.userId = decoded._id; // вшиваємо в req щоб мати доступ будь де
      next(); // все нормально, можна виконувати наступну функцію в app.get
    } catch (error) {
      console.log(error);
      return res.status(403).json({ title: "Ooops..", message: "You don't have access" });
    }
  } else {
    // return щоб не було двох відповідей
    return res.status(403).json({ title: "Ooops..", message: "You don't have access" });
  }
};
