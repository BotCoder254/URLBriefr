# Generated by Django 5.2.2 on 2025-06-07 10:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shortener', '0008_shortenedurl_enable_preview_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='shortenedurl',
            name='is_one_time_use',
        ),
        migrations.RemoveField(
            model_name='shortenedurl',
            name='preview_type',
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='one_time_use',
            field=models.BooleanField(default=False, help_text='Link expires after first use'),
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='preview_description',
            field=models.TextField(blank=True, help_text='Description of destination content', null=True),
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='preview_title',
            field=models.CharField(blank=True, help_text='Title of destination content', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='shortenedurl',
            name='preview_updated_at',
            field=models.DateTimeField(blank=True, help_text='When the preview was last updated', null=True),
        ),
        migrations.AlterField(
            model_name='shortenedurl',
            name='preview_image',
            field=models.URLField(blank=True, help_text='URL to preview image of destination', max_length=2000, null=True),
        ),
    ]
