import type { NextFunction, Request, RequestHandler, Response } from "express";
import { verify } from "jsonwebtoken";

export const AUTH_SECRET = process.env.AUTH_SECRET || "MY_SECRET";

export const authenticate: RequestHandler = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const { id } = verify(token, AUTH_SECRET);

  req.user = {
    id: id,
  };

  next();
};

// --header "Authorization: Bearer <token>"
