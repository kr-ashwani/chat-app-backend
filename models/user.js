const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const schemaOptions = {
  timestamps: {
    createdAt: "createdAt",
    updatedAt: "lastLoginAt",
  },
};

const RefreshToken = new mongoose.Schema({
  refreshToken: {
    type: String,
    require: [true, "provide refresh token"],
  },
  tokenStoringTime: {
    type: Number,
    require: [true, "provide refresh token storing time"],
  },
});

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "enter first name"],
    },
    lastName: {
      type: String,
      required: [true, "enter last name"],
    },
    collegeName: {
      type: String,
      required: [true, "enter college name"],
    },
    address: {
      type: String,
      required: [true, "enter address"],
    },
    password: {
      type: String,
      minlength: [6, "Minimum password length should be 6 characters"],
      required: [true, "enter password"],
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      validate: [isEmail, "Please enter a valid email"],
      required: [true, "enter email address"],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
      required: [true, "enter user photo Url"],
    },
    authProvider: {
      type: [String],
      validate: (v) => Array.isArray(v) && v.length > 0,
      required: [true, "provide auth provider"],
    },
    refreshTokenList: {
      type: [RefreshToken],
    },
    userName: {
      type: String,
      default: "NA",
    },
    providerAccessToken: {
      type: String,
      default: "NA",
    },
  },
  schemaOptions
);

// fire a function before doc saved to db
UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// static method to login user
UserSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("incorrect password");
  }
  throw Error("incorrect email");
};

const User = mongoose.model("user", UserSchema);
module.exports = User;
