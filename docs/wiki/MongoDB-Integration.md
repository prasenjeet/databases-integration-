# MongoDB Integration

## Driver

[`mongoose`](https://mongoosejs.com/) — the most popular MongoDB ODM for Node.js. Provides schema definition, validation, middleware, and a fluent query API on top of the native MongoDB driver.

## Source files

| File | Purpose |
|---|---|
| `src/databases/mongodb/client.ts` | Connect / disconnect helpers |
| `src/databases/mongodb/examples.ts` | Schema, CRUD, aggregation demo — blog posts |

## Connecting

```typescript
import mongoose from "mongoose";

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodb.uri);
  }
}
```

The `readyState` guard prevents double-connecting when the demo is imported from `index.ts` and from the standalone script simultaneously.

## Schema definition

```typescript
const PostSchema = new Schema<IPost>(
  {
    title:     { type: String, required: true },
    content:   { type: String, required: true },
    tags:      { type: [String], default: [] },
    views:     { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }   // adds createdAt / updatedAt automatically
);
```

## Model re-registration guard

When a file is both `require()`-d and run directly with `ts-node`, Mongoose may attempt to re-register the model and throw. The guard prevents this:

```typescript
const Post: Model<IPost> =
  (mongoose.models["Post"] as Model<IPost>) ?? mongoose.model<IPost>("Post", PostSchema);
```

## CRUD

```typescript
// Create
const post = await Post.create({ title: "Hello", content: "...", tags: ["mongo"] });

// Read
const published = await Post.find({ published: true }).sort({ createdAt: -1 });

// Update
await Post.updateOne({ _id: post._id }, { $set: { published: true, views: 10 } });

// Delete
await Post.deleteOne({ _id: post._id });
```

## Aggregation pipeline

The demo groups posts by `published` status to produce a count:

```typescript
const stats = await Post.aggregate([
  { $match: { title: /^Demo:/ } },
  { $group: { _id: "$published", count: { $sum: 1 } } },
]);
// → [{ _id: true, count: 1 }, { _id: false, count: 1 }]
```

## Demo walkthrough

The `runMongodbDemo()` function:

1. Connects to MongoDB
2. Deletes any previous `Demo:` posts (idempotent)
3. Creates two posts
4. Updates one post — sets `published: true` and increments `views`
5. Queries all published posts and prints them
6. Runs an aggregation to count posts by published status
7. Deletes one post and confirms the remaining count

## Running

```bash
npm run demo:mongodb
```

## Configuration

See [Configuration](Configuration.md#mongodb) for environment variables.
