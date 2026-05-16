import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMongo, disconnectMongo } from "./client";

interface IPost extends Document {
  title: string;
  content: string;
  tags: string[];
  views: number;
  published: boolean;
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Avoid model re-registration when running the file directly and via index.ts
const Post: Model<IPost> =
  (mongoose.models["Post"] as Model<IPost>) ?? mongoose.model<IPost>("Post", PostSchema);

export async function runMongodbDemo(): Promise<void> {
  const label = "MongoDB";
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${label} Demo`);
  console.log(`${"=".repeat(50)}`);

  try {
    await connectMongo();
    console.log(`[${label}] Connected`);

    // Wipe demo docs so the example is idempotent.
    await Post.deleteMany({ title: /^Demo:/ });

    const post1 = await Post.create({
      title: "Demo: Getting started with MongoDB",
      content: "MongoDB is a document-oriented NoSQL database...",
      tags: ["mongodb", "nosql", "database"],
      published: true,
    });
    const post2 = await Post.create({
      title: "Demo: Advanced aggregation",
      content: "Aggregation pipelines allow complex transformations...",
      tags: ["mongodb", "aggregation"],
      published: false,
    });
    console.log(`[${label}] Inserted:`, post1.title, "|", post2.title);

    // Update
    await Post.updateOne({ _id: post2._id }, { $set: { published: true, views: 10 } });
    console.log(`[${label}] Published post2`);

    // Query with filter
    const published = await Post.find({ published: true, title: /^Demo:/ }).sort({ createdAt: -1 });
    console.log(`[${label}] Published posts (${published.length}):`);
    published.forEach((p) =>
      console.log(`  _id=${p._id} title="${p.title}" tags=[${p.tags.join(",")}]`)
    );

    // Aggregation — count posts by published status
    const stats = await Post.aggregate<{ _id: boolean; count: number }>([
      { $match: { title: /^Demo:/ } },
      { $group: { _id: "$published", count: { $sum: 1 } } },
    ]);
    console.log(`[${label}] Stats:`, stats);

    // Delete
    await Post.deleteOne({ _id: post1._id });
    console.log(`[${label}] Deleted post1`);

    const remaining = await Post.countDocuments({ title: /^Demo:/ });
    console.log(`[${label}] Remaining demo posts: ${remaining}`);
  } catch (err) {
    console.error(`[${label}] Error:`, (err as Error).message);
  }
}

if (require.main === module) {
  runMongodbDemo().finally(disconnectMongo);
}
