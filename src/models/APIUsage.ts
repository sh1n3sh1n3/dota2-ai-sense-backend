import dayjs from "dayjs";
import mongoose, { Schema, Document } from "mongoose";

export interface IAPIUsage {
  steamid: string;
  count: number;
  lastReset: Date;
}

interface APIUsageModelInterface extends mongoose.Model<APIUsageDoc> {
  build(attr: IAPIUsage): APIUsageDoc;
}

interface APIUsageDoc extends mongoose.Document {
  steamid: string;
  count: number;
  lastReset: Date;
}

const APIUsageSchema = new mongoose.Schema<IAPIUsage>(
  {
    steamid: {
      type: String,
      trim: true,
    },
    count: {
      type: Number,
      trim: true,
    },
    lastReset: {
      type: Date,
      trim: true,
    },
  },
  // Created at and updated at timestamps
  { timestamps: true }
);

APIUsageSchema.statics.build = (attr: IAPIUsage) => {
  return new APIUsage({
    question: attr.steamid ?? "",
    count: attr.count ?? 0,
    lastReset: attr.lastReset ?? dayjs(),
  });
};

APIUsageSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  },
});

const APIUsage = mongoose.model<APIUsageDoc, APIUsageModelInterface>(
  "APIUsage",
  APIUsageSchema
);

export { APIUsage };
