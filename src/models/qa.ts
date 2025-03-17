import mongoose, { Schema, Document } from "mongoose";

export interface IQA {
  steamid: string;
  messages: object[];
}

interface QAModelInterface extends mongoose.Model<QADoc> {
  build(attr: IQA): QADoc;
}

interface QADoc extends mongoose.Document {
  steamid: string;
  messages: object[];
}

const QASchema = new mongoose.Schema<IQA>(
  {
    steamid: {
      type: String,
      trim: true,
    },
    messages: {
      type: [Schema.Types.Mixed],
      default: [],
      trim: true,
    },
  },
  // Created at and updated at timestamps
  { timestamps: true }
);

QASchema.statics.build = (attr: IQA) => {
  return new QA({
    steamid: attr.steamid ?? "",
    messages: attr.messages ?? [],
  });
};

QASchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  },
});

const QA = mongoose.model<QADoc, QAModelInterface>("QA", QASchema);

export { QA };
