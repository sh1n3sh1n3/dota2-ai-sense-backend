import mongoose, { Schema, Document } from "mongoose";

export interface IActionLog {
  steamid: string;
  question: string;
  action: string;
}

interface ActionLogModelInterface extends mongoose.Model<ActionLogDoc> {
  build(attr: IActionLog): ActionLogDoc;
}

interface ActionLogDoc extends mongoose.Document {
  steamid: string;
  question: string;
  action: string;
}

const ActionLogSchema = new mongoose.Schema<IActionLog>(
  {
    steamid: {
      type: String,
      trim: true,
    },
    question: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      trim: true,
    },
  },
  // Created at and updated at timestamps
  { timestamps: true }
);

ActionLogSchema.statics.build = (attr: IActionLog) => {
  return new ActionLog({
    steamid: attr.steamid ?? "",
    question: attr.question ?? "",
    action: attr.action ?? "",
  });
};

ActionLogSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.createdAt;
    delete returnedObject.updatedAt;
  },
});

const ActionLog = mongoose.model<ActionLogDoc, ActionLogModelInterface>(
  "ActionLog",
  ActionLogSchema
);

export { ActionLog };
