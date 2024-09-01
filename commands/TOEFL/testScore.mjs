import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { formatInTimeZone } from 'date-fns-tz';

export const data = new SlashCommandBuilder()
  .setName('testscore')
  .setDescription('英単語テストの結果を記録します。');

export async function execute(interaction) {
  const timeZone = 'Asia/Tokyo';
  const now = new Date();
  const today = formatInTimeZone(now, timeZone, 'yyyy-MM-dd');

  const modal = new ModalBuilder()
    .setCustomId('testScoreModal')
    .setTitle('テスト結果記録');

  const dateInput = new TextInputBuilder()
    .setCustomId('date')
    .setLabel('テスト日 (例: 2024-01-01)')
    .setStyle(TextInputStyle.Short)
    .setValue(today)  // 初期値として今日の日付を設定
    .setRequired(true);

  const scoreInput = new TextInputBuilder()
    .setCustomId('score')
    .setLabel('得点 (例: 20)')
    .setStyle(TextInputStyle.Short)
    .setValue('20')
    .setRequired(true);

  const totalQuestionsInput = new TextInputBuilder()
    .setCustomId('total_questions')
    .setLabel('問題数 (例: 20)')
    .setStyle(TextInputStyle.Short)
    .setValue('20')
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(dateInput),
    new ActionRowBuilder().addComponents(scoreInput),
    new ActionRowBuilder().addComponents(totalQuestionsInput)
  );

  await interaction.showModal(modal);
}