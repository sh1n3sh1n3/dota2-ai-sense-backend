import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Error } from "mongoose";

import { ApiError } from "../errors";
import { CustomRequest } from "../middleware/checkJwt";
import { User, IUser } from "../models/user";
import { ROLES } from "../utils/constants";
import { processErrors } from "../utils/errorProcessing";

class UserController {
  static getOneById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Get the ID from the url
    const id: string = req.params.id;

    // Validate permissions
    if (
      (req as CustomRequest).token.payload.role === ROLES.USER &&
      req.params.id !== (req as CustomRequest).token.payload.userId
    ) {
      throw new ApiError(httpStatus.FORBIDDEN, "Not enough permissions");
    }

    // Mongoose automatically casts the id to ObjectID
    const user = await User.findById(id).select(["_id", "email", "role"]);
    if (!user)
      throw new ApiError(httpStatus.NOT_FOUND, `User with ID ${id} not found`);

    res.status(200).type("json").send(user?.toJSON());
  };

  static newUser = async (userData: any) => {
    // Get parameters from the body
    const { steamid } = userData;
    try {
      const existUser = await User.findOne({ steamid }).exec();
      if (!existUser) {
        const user = User.build(userData as IUser);
        // Save the user
        return await user.save();
      } else {
        return existUser;
      }
    } catch (e: any) {
      console.error(e);
      const error = e as Error.ValidationError;
      throw new ApiError(httpStatus.BAD_REQUEST, processErrors(error));
    }
  };

  static editUser = async (req: Request, res: Response, next: NextFunction) => {
    // Get the ID from the url
    // const id = req.params.id;

    // Validate permissions
    // if (
    //   (req as CustomRequest).token.payload.role === ROLES.USER &&
    //   req.params.id !== (req as CustomRequest).token.payload.userId
    // ) {
    //   throw new ApiError(httpStatus.FORBIDDEN, "Not enough permissions");
    // }

    // Get values from the body
    const { email, steamid } = req.body;

    // Mongoose automatically casts the id to ObjectID
    const user = await User.findOne({ steamid }).exec();
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, `User not found`);

    // Edit the properties
    if (email) user.email = email;

    // Save and catch all validation errors
    try {
      await user.save();
    } catch (e) {
      const error = e as Error.ValidationError;
      throw new ApiError(httpStatus.BAD_REQUEST, processErrors(error));
    }

    res.status(200).type("json").send(user.toJSON());
  };

  static deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    // Get the ID from the url
    const id = req.params.id;

    // Mongoose automatically casts the id to ObjectID
    const user = await User.findById(id).select(["_id", "email", "role"]);
    if (!user)
      throw new ApiError(httpStatus.NOT_FOUND, `User with ID ${id} not found`);

    await user.delete();

    // After all send a 204 (no content, but accepted) response
    res.status(204).type("json").send();
  };
}

export default UserController;
