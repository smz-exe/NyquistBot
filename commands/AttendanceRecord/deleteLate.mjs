import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import Attendance from "../../models/attendance.mjs";
import { Op } from "sequelize";

export const data = new SlashCommandBuilder()
    .setName("delete_late")
    .setDescription("9:30以降の出席データを削除します。");

export async function execute(interaction) {
    const timeThreshold = "09:30:00";

    try {
        // 9:30以降の出席データを削除
        const result = await Attendance.destroy({
            where: {
                entryTime: {
                    [Op.gte]: timeThreshold,
                },
            },
        });

        const embed = new EmbedBuilder()
            .setTitle("データ削除完了")
            .setColor(0x00ae86)
            .setDescription(
                `${result}件の9:30以降の出席データが削除されました。`
            );

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("データ削除中にエラーが発生しました:", error);
        const embed = new EmbedBuilder()
            .setTitle("データ削除失敗")
            .setColor(0xff0000)
            .setDescription("データ削除中にエラーが発生しました。");

        await interaction.reply({ embeds: [embed] });
    }
}
