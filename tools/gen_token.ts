import jwt from "jsonwebtoken";
const token = jwt.sign(
  { sub: "super-admin-id", email: "admin@60sec.shop", role: "super_admin", tenantId: "system" },
  "ApexV2@Jwt-Secure#2026!Growth_Scale_QazXsw",
  { expiresIn: "1h" }
);
console.log(token);
