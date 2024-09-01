import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { formatInTimeZone } from "date-fns-tz";
import Attendance from "../../models/attendance.mjs";
import User from "../../models/user.mjs";
import { Op } from "sequelize";

export const data = new SlashCommandBuilder()
    .setName("rank")
    .setDescription(
        "過去1週間の平均出席時刻に基づいてランキングを表示します。"
    );

export async function execute(interaction) {
    const timeZone = "Asia/Tokyo";
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    try {
        // 過去1週間の出席記録を取得
        const records = await Attendance.findAll({
            where: {
                date: {
                    [Op.between]: [
                        formatInTimeZone(oneWeekAgo, timeZone, "yyyy-MM-dd"),
                        formatInTimeZone(now, timeZone, "yyyy-MM-dd"),
                    ],
                },
            },
            include: [{ model: User }],
            raw: true,
        });

        if (records.length === 0) {
            await interaction.reply(
                "過去1週間の出席記録が見つかりませんでした。"
            );
            return;
        }

        // ユーザーごとの平均出席時刻を計算
        const userAverages = records.reduce((acc, record) => {
            const userId = record["User.id"];
            const username = record["User.username"];
            const entryTime = new Date(
                `1970-01-01T${record.entryTime}Z`
            ).getTime(); // エポックからのミリ秒に変換

            if (!acc[userId]) {
                acc[userId] = {
                    username,
                    totalEntryTime: 0,
                    count: 0,
                };
            }

            acc[userId].totalEntryTime += entryTime;
            acc[userId].count += 1;

            return acc;
        }, {});

        // 平均出席時刻を計算
        const sortedUsers = Object.values(userAverages)
            .map((user) => {
                return {
                    username: user.username,
                    averageEntryTime: new Date(user.totalEntryTime / user.count)
                        .toISOString()
                        .substr(11, 8), // 平均時刻をHH:mm:ss形式に変換
                };
            })
            .sort((a, b) =>
                a.averageEntryTime.localeCompare(b.averageEntryTime)
            ); // 早い順にソート

        // Embedメッセージを作成
        const embed = new EmbedBuilder()
            .setTitle("過去1週間の出席ランキング")
            .setColor(0x00ae86)
            .setDescription("過去1週間の平均出席時刻に基づくランキングです。");

        sortedUsers.forEach((user, index) => {
            embed.addFields({
                name: `#${index + 1} ${user.username}`,
                value: `平均出席時刻: ${user.averageEntryTime}`,
            });
        });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("ランキングの取得中にエラーが発生しました:", error);
        await interaction.reply("ランキングの取得中にエラーが発生しました。");
    }
}
