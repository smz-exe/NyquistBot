import { DataTypes } from "sequelize";
import sequelize from "./sequelize.mjs";
import User from "./user.mjs";

const Attendance = sequelize.define("Attendance", {
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    entryTime: {
        type: DataTypes.TIME,
        allowNull: false,
    },
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

Attendance.belongsTo(User, { foreignKey: "UserId" });

export default Attendance;
