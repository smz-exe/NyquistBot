import {
    SlashCommandBuilder,
    ModalBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import { formatInTimeZone } from "date-fns-tz";

export const data = new SlashCommandBuilder()
    .setName("manual_attend")
    .setDescription("出席時刻の入力フォームが開きます。");

export async function execute(interaction) {
    const timeZone = "Asia/Tokyo";
    const now = new Date();
    const today = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
    const currentTime = formatInTimeZone(now, timeZone, "HH:mm");

    const modal = new ModalBuilder()
        .setCustomId("manualAttendModal")
        .setTitle("手動出席記録");

    const dateInput = new TextInputBuilder()
        .setCustomId("date")
        .setLabel("出席日 (例: 2024-01-01)(※ 0も入力してください)")
        .setStyle(TextInputStyle.Short)
        .setValue(today) // 初期値として今日の日付を設定
        .setRequired(true);

    const timeInput = new TextInputBuilder()
        .setCustomId("time")
        .setLabel("出席時刻 (例: 07:00)(※ 0も入力してください)")
        .setStyle(TextInputStyle.Short)
        .setValue(currentTime) // 初期値として現在の時刻を設定
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(timeInput)
    );

    await interaction.showModal(modal);
}
