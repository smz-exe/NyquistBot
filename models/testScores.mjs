import { DataTypes } from "sequelize";
import sequelize from "./sequelize.mjs";
import User from "./user.mjs";

const TestScore = sequelize.define(
    "TestScore",
    {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        totalQuestions: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        normalizedScore: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
    },
    {
        timestamps: false,
    }
);

// Userモデルとの関連付け
TestScore.belongsTo(User, { foreignKey: "userId" });
User.hasMany(TestScore, { foreignKey: "userId" });

export default TestScore;
