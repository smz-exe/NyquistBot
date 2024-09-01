import { DataTypes } from "sequelize";
import sequelize from "./sequelize.mjs";

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

export default User;