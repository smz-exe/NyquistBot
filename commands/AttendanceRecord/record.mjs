import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { formatInTimeZone } from "date-fns-tz";
import Attendance from "../../models/attendance.mjs";
import User from "../../models/user.mjs";

export const data = new SlashCommandBuilder()
    .setName("record")
    .setDescription("当日の出席記録を表示します。");

export async function execute(interaction) {
    try {
        const timeZone = "Asia/Tokyo";
        const now = new Date();
        const today = formatInTimeZone(now, timeZone, "yyyy-MM-dd");

        const records = await Attendance.findAll({
            where: { date: today },
            include: [{ model: User }],
        });

        console.log("取得した出席記録:", records);

        if (records.length === 0) {
            await interaction.reply("本日の出席記録が見つかりませんでした。");
            return;
        }

        const userRecords = records.reduce((acc, record) => {
            const user = record.User;
            if (user) {
                const { username } = user;
                const date = record.date;
                const entryTime = record.entryTime;

                if (!acc[username]) {
                    acc[username] = {};
                }
                acc[username][date] = entryTime;
            }

            return acc;
        }, {});

        const embed = new EmbedBuilder()
            .setTitle("本日の出席記録")
            .setColor(0x00ae86)
            .setDescription("ユーザーごとの出席記録");

        Object.keys(userRecords).forEach((user) => {
            embed.addFields({
                name: user,
                value: userRecords[user][today],
                inline: true,
            });
        });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("出席記録の取得中にエラーが発生しました:", error);
        await interaction.reply("出席記録の取得中にエラーが発生しました。");
    }
}
