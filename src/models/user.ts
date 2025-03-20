import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ROLES } from "../utils/constants";

export interface IUser {
  steamid: string;
  email: string;
  location: string;
  name: string;
  subscription: string;
  customerId: string;
}

interface userModelInterface extends mongoose.Model<UserDoc> {
  build(attr: IUser): UserDoc;
}

interface UserDoc extends mongoose.Document {
  steamid: string;
  email: string;
  location: string;
  name: string;
  subscription: string;
  customerId: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    steamid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows multiple documents with null/undefined values
    },
    location: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    subscription: {
      type: String,
      trim: true,
    },
    customerId: {
      type: String,
      trim: true,
    },
  },
  // Created at and updated at timestamps
  { timestamps: true }
);

userSchema.statics.build = (attr: IUser) => {
  return new User({
    steamid: attr.steamid,
    email: attr.email ?? "",
    location: attr.location ?? "",
    name: attr.name,
    subscription: attr.subscription ?? "Free",
    customerId: attr.customerId ?? "",
  });
};

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  },
});

const User = mongoose.model<UserDoc, userModelInterface>("User", userSchema);

export { User };
