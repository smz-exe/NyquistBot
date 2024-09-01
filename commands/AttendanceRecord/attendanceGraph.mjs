import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import Attendance from "../../models/attendance.mjs";
import User from "../../models/user.mjs";
import QuickChart from "quickchart-js";
import { formatInTimeZone } from "date-fns-tz";
import { Op } from "sequelize";

export const data = new SlashCommandBuilder()
    .setName("attendance_graph")
    .setDescription("Displays the attendance history over the past week.");

export async function execute(interaction) {
    const timeZone = "Asia/Tokyo";
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    try {
        // Fetch attendance records from the past week
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
            order: [["date", "ASC"]],
            raw: true,
        });

        console.log("Fetched records:", records);

        if (records.length === 0) {
            await interaction.reply(
                "No attendance records found for the past week."
            );
            return;
        }

        // Organize data by user and date
        const userMap = records.reduce((acc, record) => {
            const username = record["User.username"];
            const date = record.date;
            const entryTime = record.entryTime;

            if (!acc[username]) {
                acc[username] = {};
            }

            acc[username][date] = entryTime;

            return acc;
        }, {});

        console.log("User map:", userMap);

        // Generate labels for the x-axis (days)
        const labels = Array.from(
            new Set(records.map((record) => record.date))
        ).sort();

        // Create datasets
        const datasets = Object.keys(userMap).map((username) => {
            const data = labels.map((date) => {
                const time = userMap[username][date];
                if (time) {
                    const yValue =
                        parseFloat(time.split(":")[0]) +
                        parseFloat(time.split(":")[1]) / 60;
                    console.log(`Data point for ${username}:`, {
                        x: date,
                        y: yValue,
                    });
                    return yValue;
                } else {
                    return null; // No data for this date
                }
            });

            return {
                label: username,
                data: data, // Use the y-values for the data points
                borderColor: `rgba(${Math.floor(
                    Math.random() * 255
                )}, ${Math.floor(Math.random() * 255)}, ${Math.floor(
                    Math.random() * 255
                )}, 1)`,
                fill: false,
                tension: 0.1,
            };
        });

        console.log("Datasets:", datasets);

        // QuickChart のインスタンスを作成
        const chart = new QuickChart();
        chart
            .setConfig({
                type: "line",
                data: {
                    labels: labels,
                    datasets: datasets,
                },
                options: {
                    scales: {
                        xAxes: [
                            {
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: "日付",
                                },
                            },
                        ],
                        yAxes: [
                            {
                                display: true,
                                scaleLabel: {
                                    display: true,
                                    labelString: "出席時刻",
                                },
                                ticks: {
                                    suggestedMin: 6,
                                    suggestedMax: 9,
                                    reverse: true,
                                    callback: function (value) {
                                        const hours = Math.floor(value);
                                        const minutes = Math.floor(
                                            (value % 1) * 60
                                        );
                                        return `${hours}:${minutes
                                            .toString()
                                            .padStart(2, "0")}`;
                                    },
                                },
                            },
                        ],
                    },
                },
            })
            .setWidth(800)
            .setHeight(600)
            .setBackgroundColor("white");

        // 画像URLを取得
        const imageUrl = chart.getUrl();

        // 画像をDiscordに送信
        const attachment = new AttachmentBuilder(imageUrl, {
            name: "attendance_graph.png",
        });
        await interaction.reply({ files: [attachment] });
    } catch (error) {
        console.error("Error generating graph:", error);
        await interaction.reply(
            "An error occurred while generating the graph."
        );
    }
}
