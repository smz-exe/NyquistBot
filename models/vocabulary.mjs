import { DataTypes } from 'sequelize';
import sequelize from './sequelize.mjs';

const Vocabulary = sequelize.define('Vocabulary', {
    section: {
        type: DataTypes.STRING,
        allowNull: false
    },
    english: {
        type: DataTypes.STRING,
        allowNull: false
    },
    japanese: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

export default Vocabulary;