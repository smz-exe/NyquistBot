import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { formatInTimeZone } from "date-fns-tz";
import Attendance from "../../models/attendance.mjs";
import User from "../../models/user.mjs";
import { Op } from "sequelize";

export const data = new SlashCommandBuilder()
    .setName("kakuduke")
    .setDescription("過去1週間の平均出席時刻に基づいて格付けを行う。");

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

        if (sortedUsers.length > 0) {
            const guild = interaction.guild;
            const highestRole = guild.roles.cache.find(
                (role) => role.name === "The Highest T"
            );
            const lowestRole = guild.roles.cache.find(
                (role) => role.name === "激 Low"
            );
            const highTRole = guild.roles.cache.find(
                (role) => role.name === "High T"
            );

            // 全メンバーから既存のロールを削除
            const members = await guild.members.fetch();
            for (const member of members.values()) {
                if (highestRole && member.roles.cache.has(highestRole.id)) {
                    await member.roles.remove(highestRole);
                }
                if (lowestRole && member.roles.cache.has(lowestRole.id)) {
                    await member.roles.remove(lowestRole);
                }
                if (highTRole && member.roles.cache.has(highTRole.id)) {
                    await member.roles.remove(highTRole);
                }
            }

            // 1位のユーザーに 'The Highest T' ロールを付与
            const highestUser = sortedUsers[0];
            const highestMember = await guild.members
                .fetch({ query: highestUser.username, limit: 1 })
                .then((members) => members.first());
            if (highestMember && highestRole) {
                await highestMember.roles.add(highestRole);
            }

            // 最下位のユーザーに '激 Low' ロールを付与
            const lowestUser = sortedUsers[sortedUsers.length - 1];
            const lowestMember = await guild.members
                .fetch({ query: lowestUser.username, limit: 1 })
                .then((members) => members.first());
            if (lowestMember && lowestRole) {
                await lowestMember.roles.add(lowestRole);
            }

            // 平均出席時間が7:15より早いユーザーに 'High T' ロールを付与
            const highTThreshold = new Date(`1970-01-01T07:15:00Z`).getTime();
            for (const user of sortedUsers) {
                const averageEntryTimeInMs = new Date(
                    `1970-01-01T${user.averageEntryTime}Z`
                ).getTime();
                if (averageEntryTimeInMs < highTThreshold) {
                    const member = await guild.members
                        .fetch({ query: user.username, limit: 1 })
                        .then((members) => members.first());
                    if (member && highTRole) {
                        await member.roles.add(highTRole);
                    }
                }
            }

            // Embedメッセージを作成
            const embed = new EmbedBuilder()
                .setTitle("格付けのお時間")
                .setColor(0xffd700)
                .setDescription(
                    "過去1週間の平均出席時刻に基づく格付け。1位には 'The Highest T'、最下位には '激 Low'、7:15より早いユーザーには 'High T'が付与されます。"
                );

            sortedUsers.forEach((user, index) => {
                let rankMessage;
                if (index === 0) {
                    rankMessage = "🥇 The Highest T";
                } else if (index === sortedUsers.length - 1) {
                    rankMessage = "🏅 激 Low";
                } else {
                    rankMessage = `#${index + 1}`;
                }
                embed.addFields({
                    name: rankMessage,
                    value: `${user.username} - 平均出席時刻: ${user.averageEntryTime}`,
                });
            });

            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply("ランキングの計算に失敗しました。");
        }
    } catch (error) {
        console.error("ランキングの取得中にエラーが発生しました:", error);
        await interaction.reply("ランキングの取得中にエラーが発生しました。");
    }
}
