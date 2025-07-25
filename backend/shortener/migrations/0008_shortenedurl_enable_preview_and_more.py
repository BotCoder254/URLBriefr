# Generated by Django 5.2.2 on 2025-06-07 10:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shortener', '0007_spoofingattempt_shortenedurl_cloned_from_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='shortenedurl',
            name='enable_preview',
            field=models.BooleanField(default=False, help_text='Enable live preview of destination content'),
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='is_one_time_use',
            field=models.BooleanField(default=False, help_text='Link will expire after first click'),
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='preview_image',
            field=models.URLField(blank=True, help_text='URL to preview image or snapshot', max_length=2000, null=True),
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='preview_type',
            field=models.CharField(blank=True, choices=[('snapshot', 'Snapshot'), ('iframe', 'Iframe Embed'), ('video', 'Video Preview')], default='snapshot', max_length=20),
        ),
    ]
