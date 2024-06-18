import { Application } from 'egg';
import * as AutoIncrementFactory from 'mongoose-sequence'
import { UserProps } from './user';
import { ObjectId } from 'mongoose';

interface ChannelProps {
  name: string;
  id: string;
}
export interface WorkProps {
  id?: number;
  uuid: string;
  title: string;
  desc: string;
  coverImg?: string;
  content?: { [key: string]: any };
  isTemplate?: boolean;
  isPublic?: boolean;
  isHot?: boolean;
  author: string;
  copiedCount: number;
  status?: 0 | 1 | 2;
  // user: Schema.Types.ObjectId;
  user: ObjectId;
  latestPublishAt?: Date;
  channels?: ChannelProps[];
}

const initWorkModle = (app: Application) => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema
  const AutoIncrement = AutoIncrementFactory(mongoose)

  const WorkSchema = new Schema({
    uuid: { type: String, unique: true },
    title: { type: String },
    desc: { type: String },
    coverImg: { type: String },
    content: { type: Object },
    isTemplate: { type: Boolean },
    isPublic: { type: Boolean },
    isHot: { type: Boolean },
    author: { type: String },
    copiedCount: { type: Number, default: 0 },
    status: { type: Number, default: 1 },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    latestPublishAt: { type: Date },
    channels: { type: Array }
  }, {
    timestamps: true
  })
  WorkSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'works_id_counter' })
  return mongoose.model<WorkProps>('Work', WorkSchema)
}

export default initWorkModle
