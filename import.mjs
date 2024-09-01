import { Sequelize, DataTypes } from 'sequelize';
import { readFile } from 'fs/promises';
import 'dotenv/config';

// Sequelizeの初期化
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false,
});

// Vocabularyモデルの定義
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

// データをインポートする関数
async function importData() {
  try {
    const fileContent = await readFile('vocabulary_data.json', 'utf8');
    const sections = JSON.parse(fileContent);

    // sectionsが配列であることを確認
    if (!Array.isArray(sections)) {
      throw new Error('データの形式が正しくありません。');
    }

    const records = [];
    for (const sectionData of sections) {
      const { section, data } = sectionData;

      // dataが配列であることを確認
      if (!Array.isArray(data)) {
        throw new Error('データの形式が正しくありません。');
      }

      data.forEach(item => {
        records.push({
          section,
          english: item.english,
          japanese: item.japanese
        });
      });
    }

    await Vocabulary.bulkCreate(records);
    console.log('データがインポートされました。');
  } catch (error) {
    console.error('データのインポート中にエラーが発生しました:', error);
  } finally {
    await sequelize.close();
  }
}

// スクリプトの実行
(async () => {
  try {
    // 既存のVocabularyテーブルをドロップ
    await sequelize.drop();

    // テーブルを再作成
    await sequelize.sync();

    // データをインポート
    await importData();
  } catch (error) {
    console.error('スクリプトの実行中にエラーが発生しました:', error);
  }
})();
