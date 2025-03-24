import mongoose, { Schema, Document } from "mongoose";

export interface IPreQuestion {
  question: string;
}

interface PreQuestionModelInterface extends mongoose.Model<PreQuestionDoc> {
  build(attr: IPreQuestion): PreQuestionDoc;
}

interface PreQuestionDoc extends mongoose.Document {
  question: string;
}

const PreQuestionSchema = new mongoose.Schema<IPreQuestion>(
  {
    question: {
      type: String,
      trim: true,
    },
  },
  // Created at and updated at timestamps
  { timestamps: true }
);

PreQuestionSchema.statics.build = (attr: IPreQuestion) => {
  return new PreQuestion({
    question: attr.question ?? "",
  });
};

PreQuestionSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  },
});

const PreQuestion = mongoose.model<PreQuestionDoc, PreQuestionModelInterface>(
  "PreQuestion",
  PreQuestionSchema
);

export { PreQuestion };
