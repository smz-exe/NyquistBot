import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';

export const data = new SlashCommandBuilder()
  .setName('benkyo')
  .setDescription('ボイスチャンネルに参加した上で使用してください');

export async function execute(interaction) {
  if (!interaction.member.voice.channel) {
    return interaction.reply('音声を再生するにはボイスチャンネルに参加する必要があります。');
  }

  const connection = joinVoiceChannel({
    channelId: interaction.member.voice.channel.id,
    guildId: interaction.guild.id,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  });

  try {
    const stream = await ytdl('https://youtube.com/shorts/eR1n33JhTdg?si=gic_kjsenf26UApK', { filter: 'audioonly' });
    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    await interaction.reply('勉強してください');
  } catch (error) {
    console.error('音声の再生中にエラーが発生しました:', error);
    await interaction.reply({ content: '音声の再生中にエラーが発生しました。', ephemeral: true });
  }
}
