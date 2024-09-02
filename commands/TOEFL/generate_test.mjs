import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import puppeteer from "puppeteer";
import Vocabulary from "../../models/vocabulary.mjs";
import sequelize from "../../models/sequelize.mjs";

async function getSections() {
    const sections = await Vocabulary.findAll({
        attributes: [
            [sequelize.fn("DISTINCT", sequelize.col("section")), "section"],
        ],
    });
    return sections.map((s) => s.section);
}

const sections = await getSections();

export const data = new SlashCommandBuilder()
    .setName("generate_test")
    .setDescription("指定されたセクションの単語テストを生成します。")
    .addStringOption((option) => {
        option
            .setName("section")
            .setDescription("セクション名")
            .setRequired(true);
        sections.forEach((section) =>
            option.addChoices({ name: section, value: section })
        );
        return option;
    })
    .addStringOption((option) =>
        option
            .setName("format")
            .setDescription("テスト形式 (enToJp または jpToEn)")
            .setRequired(true)
            .addChoices(
                { name: "英語から日本語", value: "enToJp" },
                { name: "日本語から英語", value: "jpToEn" }
            )
    )
    .addIntegerOption((option) =>
        option
            .setName("num_questions")
            .setDescription("問題数")
            .setRequired(true)
    )
    .addIntegerOption((option) =>
        option
            .setName("test_duration")
            .setDescription("テスト時間 (分)")
            .setRequired(true)
    );

export async function execute(interaction) {
    const section = interaction.options.getString("section");
    const format = interaction.options.getString("format");
    const numQuestions = interaction.options.getInteger("num_questions");
    const testDuration = interaction.options.getInteger("test_duration");

    try {
        // Acknowledge the interaction immediately
        await interaction.deferReply();

        // テーブルを同期（存在しない場合は作成）
        await sequelize.sync();

        const data = await Vocabulary.findAll({ where: { section } });

        if (data.length === 0) {
            await interaction.editReply(
                "指定されたセクションのデータが見つかりませんでした。"
            );
            return;
        }

        // ランダムに問題を選択
        const shuffled = data.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, numQuestions);

        // テスト問題のHTMLコンテンツ
        const testHtmlContent = `
      <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');
            body {
              font-family: 'Noto Sans JP', sans-serif;
              background-color: #f9f9f9;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #4CAF50;
              position: relative;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 30px 0;
            }
            .input-group,
            .score-box {
              display: flex;
              align-items: center;
            }
            .input-group input[type="text"] {
              border: none;
              border-bottom: 1px solid #ddd;
              outline: none;
              height: 30px;
              width: 200px;
              text-align: right;
            }
            .score-box input {
              width: 80px;
              text-align: right;
              border: 1px solid #ddd;
              border-radius: 4px;
              margin-left: 5px;
            }
            .question-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
            }
            .question {
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 9px;
              margin-bottom: 6px;
              width: 48%;
              box-sizing: border-box;
              line-height: 1.2em;
              page-break-inside: avoid;
            }
            .question-number {
              font-weight: bold;
              color: #4CAF50;
            }
            .question-text {
              margin: 6px 0;
            }
            .answer-line {
              display: inline-block;
              width: 85%;
              border-bottom: 1px solid #ddd;
              height: 1.2em;
            }
            @media print {
            .question {
              page-break-before: auto; /* Avoid breaking inside the question block */
              }
            }
          </style>
        </head>
        <body>
          <h1>TOEFLテスト 英単語3800</h1>
          <div class="header">
            <div class="score-box">
              <input type="text" id="score" name="score" value=" / ${numQuestions}" />
            </div>
            <div class="input-group">
              Name:
              <input type="text" id="name" name="name" />
            </div>
          </div>
          <div class="question-container">
            ${selectedQuestions
                .map(
                    (item, index) => `
              <div class="question">
                <div class="question-number">${index + 1}.</div>
                <div class="question-text">${
                    format === "enToJp" ? item.english : item.japanese
                }</div>
                <div class="answer-line"></div>
              </div>
            `
                )
                .join("")}
          </div>
        </body>
      </html>
    `;

        // 解答のHTMLコンテンツ
        const answerHtmlContent = `
      <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');
            body {
              font-family: 'Noto Sans JP', sans-serif;
              background-color: #f9f9f9;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #4CAF50;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 20px 0; /* Add margin to create space between the elements */
            }
            .input-group,
            .score-box {
              display: flex;
              align-items: center;
            }
            .input-group input[type="text"] {
              border: none;
              border-bottom: 1px solid #ddd;
              outline: none;
              height: 30px;
              width: 200px;
              text-align: right;
            }
            .score-box input {
              width: 80px;
              text-align: right;
              border: 1px solid #ddd;
              border-radius: 4px;
              margin-left: 5px;
            }
            .question-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
            }
            .question {
              background-color: #fff;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 9px;
              margin-bottom: 8px;
              width: 48%;
              box-sizing: border-box;
              line-height: 1.2em;
              page-break-inside: avoid;
            }
            .question-number {
              font-weight: bold;
              color: #4CAF50;
            }
            .question-text {
              margin: 7px 0;
            }
            @media print {
            .question {
              page-break-before: auto; /* Avoid breaking inside the question block */
              }
            }
          </style>
        </head>
        <body>
          <<h1>TOEFLテスト 英単語3800 - 解答</h1>
          <div class="header">
            <div class="score-box">
              <input type="text" id="score" name="score" value=" / ${numQuestions}" />
            </div>
            <div class="input-group">
              Name:
              <input type="text" id="name" name="name" />
            </div>
          </div>
          <div class="question-container">
            ${selectedQuestions
                .map(
                    (item, index) => `
              <div class="question">
                <div class="question-number">${index + 1}.</div>
                <div class="question-text">${
                    format === "enToJp"
                        ? `${item.english} - ${item.japanese}`
                        : `${item.japanese} - ${item.english}`
                }</div>
                </div>
            `
                )
                .join("")}
          </div>
        </body>
      </html>
    `;

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();

        // テスト問題のPDF生成
        await page.setContent(testHtmlContent);
        const testPdfBuffer = await page.pdf({ format: "A4" });

        await browser.close();

        const testAttachment = new AttachmentBuilder(
            Buffer.from(testPdfBuffer),
            {
                name: `word_test_${section}.pdf`,
            }
        );
        await interaction.editReply({
            files: [testAttachment],
            content: `テスト開始 試験時間は${testDuration}分です`,
        });

        // テスト終了後に解答を送信
        setTimeout(async () => {
            const browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            const page = await browser.newPage();
            await page.setContent(answerHtmlContent);
            const answerPdfBuffer = await page.pdf({ format: "A4" });
            await browser.close();

            const answerAttachment = new AttachmentBuilder(
                Buffer.from(answerPdfBuffer),
                {
                    name: `word_test_${section}_answers.pdf`,
                }
            );
            await interaction.followUp({
                files: [answerAttachment],
                content: "テスト終了 採点を行なってください",
            });
        }, testDuration * 60 * 1000); // テスト時間（分）をミリ秒に変換
    } catch (error) {
        console.error("PDF生成中にエラーが発生しました:", error);
        if (!interaction.replied) {
            await interaction.editReply({
                content: "PDF生成中にエラーが発生しました。",
                ephemeral: true,
            });
        } else {
            await interaction.followUp({
                content: "PDF生成中にエラーが発生しました。",
                ephemeral: true,
            });
        }
    }
}
