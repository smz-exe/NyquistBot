import { Sequelize } from 'sequelize';
import SQLite from 'sqlite3';
import path from 'path';
import 'dotenv/config';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), process.env.SQLITE_STORAGE || 'database.sqlite'),
  dialectOptions: {
    mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
  },
  logging: false,
});

const Vocabulary = sequelize.define('Vocabulary', {
    section: {
        type: Sequelize.STRING,
        allowNull: false
    },
    english: {
        type: Sequelize.STRING,
        allowNull: false
    },
    japanese: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

export const disableForeignKeyConstraints = async () => {
  await sequelize.query('PRAGMA foreign_keys = OFF');
};

export const enableForeignKeyConstraints = async () => {
  await sequelize.query('PRAGMA foreign_keys = ON');
};

export const getSections = async () => {
  try {
    const sections = await Vocabulary.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('section')), 'section']
      ],
      raw: true
    });
    return sections.map(section => section.section);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
};

export default sequelize;