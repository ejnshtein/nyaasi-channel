import mongoose from 'mongoose'

const { Schema } = mongoose

export const Subscription = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    conditions: {
      type: {
        name: {
          type: {
            regex: {
              type: String,
              required: true
            },
            options: {
              type: String,
              required: true,
              default: 'i'
            }
          },
          required: true
        },
        submitter: {
          type: String,
          required: true,
          default: 'any'
        },
        trusted: {
          type: Boolean
        },
        remake: {
          type: Boolean
        }
      },
      required: true,
      default: {
        submitter: 'any'
      }
    },
    chats: {
      type: [Number],
      required: true,
      default: []
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
)
