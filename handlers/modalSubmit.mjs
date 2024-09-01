import { EmbedBuilder } from "discord.js";
import Attendance from "../models/attendance.mjs";
import User from "../models/user.mjs";
import TestScore from "../models/testScores.mjs";
import { parseISO, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export default async function handleModalSubmit(interaction) {
    if (interaction.customId === "manualAttendModal") {
        const username = interaction.user.username;
        const date = interaction.fields.getTextInputValue("date");
        const time = interaction.fields.getTextInputValue("time");

        const [hour, minute] = time.split(":").map(Number);
        if (hour < 5 || hour >= 10) {
            const embed = new EmbedBuilder()
                .setTitle("出席記録失敗")
                .setColor(0xff0000)
                .setDescription("出席は5:00から10:00の間にのみ記録できます。");

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            const user = await User.findOne({ where: { username } });

            if (!user) {
                const embed = new EmbedBuilder()
                    .setTitle("出席記録失敗")
                    .setColor(0xff0000)
                    .setDescription(
                        "最初に /register を使って登録する必要があります。"
                    );

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            const existingAttendance = await Attendance.findOne({
                where: { date: date, UserId: user.id },
            });

            if (existingAttendance) {
                await existingAttendance.update({ entryTime: time });
                const embed = new EmbedBuilder()
                    .setTitle("出席記録更新")
                    .setColor(0x00ae86)
                    .setDescription(
                        `出席記録が更新されました。${date} の ${time} に変更されました。`
                    );

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                const attendance = await Attendance.create({
                    date: date,
                    entryTime: time,
                    UserId: user.id,
                });

                console.log("手動出席記録が保存されました:", attendance);

                const embed = new EmbedBuilder()
                    .setTitle("手動出席を確認")
                    .setColor(0x00ae86)
                    .setDescription(
                        `ユーザー名 ${username} が ${date} の ${time} に出席しました。`
                    );

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            console.error("手動出席記録の保存中にエラーが発生しました:", error);
            const embed = new EmbedBuilder()
                .setTitle("出席記録失敗")
                .setColor(0xff0000)
                .setDescription("出席を記録中にエラーが発生しました。");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    if (interaction.customId === "testScoreModal") {
        const username = interaction.user.username;
        const timeZone = "Asia/Tokyo";
        const now = new Date();
        const date = parseISO(interaction.fields.getTextInputValue("date"));
        const today = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
        const formattedDate = format(date, "yyyy-MM-dd");
        const score = parseInt(
            interaction.fields.getTextInputValue("score"),
            10
        );
        const totalQuestions = parseInt(
            interaction.fields.getTextInputValue("total_questions"),
            10
        );
        const normalizedScore = (score / totalQuestions) * 100;

        if (isNaN(score) || isNaN(totalQuestions) || totalQuestions <= 0) {
            const embed = new EmbedBuilder()
                .setTitle("記録失敗")
                .setColor(0xff0000)
                .setDescription(
                    "得点と問題数は有効な数値でなければなりません。"
                );

            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            const user = await User.findOne({ where: { username } });

            if (!user) {
                const embed = new EmbedBuilder()
                    .setTitle("記録失敗")
                    .setColor(0xff0000)
                    .setDescription(
                        "最初に /register を使って登録する必要があります。"
                    );

                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            await interaction.deferReply();

            const existingTestScore = await TestScore.findOne({
                where: { date: formattedDate, userId: user.id },
            });

            if (existingTestScore) {
                await existingTestScore.update({
                    score,
                    totalQuestions,
                    normalizedScore,
                });
                const embed = new EmbedBuilder()
                    .setTitle("テスト結果更新")
                    .setColor(0x00ae86)
                    .setDescription(
                        `テスト結果が更新されました。${formattedDate} のスコアは ${score}/${totalQuestions} (${normalizedScore.toFixed(
                            2
                        )}%) です。`
                    );

                await interaction.followUp({ embeds: [embed] });
            } else {
                const testScore = await TestScore.create({
                    userId: user.id,
                    date: formattedDate,
                    score,
                    totalQuestions,
                    normalizedScore,
                });

                console.log("テスト結果が保存されました:", testScore);

                const embed = new EmbedBuilder()
                    .setTitle("テスト結果を記録")
                    .setColor(0x00ae86)
                    .setDescription(
                        `ユーザー名 ${username} が ${formattedDate} に ${score}/${totalQuestions} の得点を記録しました。\n(100点満点換算: ${normalizedScore.toFixed(
                            2
                        )}点)`
                    );

                await interaction.followUp({ embeds: [embed] });
            }
        } catch (error) {
            console.error("テスト結果の保存中にエラーが発生しました:", error);
            const embed = new EmbedBuilder()
                .setTitle("記録失敗")
                .setColor(0xff0000)
                .setDescription("テスト結果を記録中にエラーが発生しました。");

            await interaction.followUp({ embeds: [embed], ephemeral: true });
        }
    }
}
