import mongoose from 'mongoose'

const { Schema } = mongoose

export const Torrent = new Schema(
  {},
  {
    strict: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  })
