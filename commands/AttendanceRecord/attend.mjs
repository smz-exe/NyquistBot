import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { formatInTimeZone } from "date-fns-tz";
import Attendance from "../../models/attendance.mjs";
import User from "../../models/user.mjs";

export const data = new SlashCommandBuilder()
    .setName("attend")
    .setDescription("出席を記録します。");

export async function execute(interaction) {
    const username = interaction.user.username;
    const timeZone = "Asia/Tokyo";
    const now = new Date();
    const today = formatInTimeZone(now, timeZone, "yyyy-MM-dd");
    const currentTime = formatInTimeZone(now, timeZone, "HH:mm:ss");

    const japanTime = new Date(
        formatInTimeZone(now, timeZone, "yyyy-MM-dd HH:mm:ss")
    );

    let message;
    const currentHour = japanTime.getHours();
    const currentMinute = japanTime.getMinutes();

    // 5:00から10:00までの範囲をチェック
    if (currentHour < 5 || currentHour >= 10) {
        const embed = new EmbedBuilder()
            .setTitle("出席記録失敗")
            .setColor(0xff0000)
            .setDescription("出席は5:00から10:00の間にのみ記録できます。");

        await interaction.reply({ embeds: [embed] });
        return;
    }

    if (currentHour < 7) {
        message = "早起き、流石です。";
    } else if (currentHour === 7 && currentMinute < 1) {
        message = "7:00着、今日も一日頑張ろう。";
    } else if (currentHour === 7 && currentMinute >= 1 && currentMinute < 6) {
        message = "この数分の遅れが一番勿体無い。";
    } else if (currentHour === 7 && currentMinute >= 6 && currentMinute < 30) {
        message = "中途半端が一番良くない。";
    } else if (currentHour === 7 && currentMinute >= 30 && currentHour < 8) {
        message = "要反省。";
    } else if (currentHour >= 8 && currentHour < 9) {
        message = "大丈夫そ？";
    } else {
        message = "何してたんですか？";
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

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // 同じ日の出席データが既に存在するか確認
        const existingAttendance = await Attendance.findOne({
            where: { date: today, UserId: user.id },
        });

        if (existingAttendance) {
            const embed = new EmbedBuilder()
                .setTitle("出席記録失敗")
                .setColor(0xff0000)
                .setDescription("同じ日の出席データは既に存在します。");

            await interaction.reply({ embeds: [embed] });
            return;
        }

        // 新しい出席データを保存
        const attendance = await Attendance.create({
            date: today,
            entryTime: currentTime,
            UserId: user.id,
        });

        console.log("出席記録が保存されました:", attendance);

        const embed = new EmbedBuilder()
            .setTitle("出席を確認")
            .setColor(0x00ae86)
            .setDescription(
                `${username} が ${currentTime} に出席。 ${message}`
            );

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error("出席記録の保存中にエラーが発生しました:", error);
        const embed = new EmbedBuilder()
            .setTitle("出席記録失敗")
            .setColor(0xff0000)
            .setDescription("出席を記録中にエラーが発生しました。");

        await interaction.reply({ embeds: [embed] });
    }
}
